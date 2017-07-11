/**
 * @license
 * Copyright 2017 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as chai from 'chai';
import {rdb} from '../../lib/rdb';
import {DatabaseConnection} from '../../lib/spec/database_connection';
import {Table} from '../../lib/spec/table';

const assert = chai.assert;

describe('SimpleEndToEnd', () => {
  it('simple_SCUD', () => {
    let db: DatabaseConnection = null;
    let payloads = [{'id': 1, 'name': 'what'}, {'id': 2, 'name': 'whom'}];
    let table: Table = null;
    return rdb.open('foo', {storageType: 'temporary'})
        .then((conn: DatabaseConnection) => {
          assert.isNotNull(conn);
          db = conn;
          return db.createTable('foo')
                  .column('id', 'integer')
                  .column('name', 'string')
                  .commit();
        }).then(() => {
          table = db.schema().table('foo');
          return db.insert().into(table).values(payloads).commit();
        }).then(() => {
          return db.select().from(table).where(table['id'].eq(1)).commit();
        }).then((rows: object[]) => {
          assert.equal(1, rows.length);
          assert.deepEqual(payloads[0], rows[0]);
          return db.update(table).set(table['name'], 'nono').commit();
        }).then(() => {
          return db.select(table['name']).from(table).commit();
        }).then((rows: object[]) => {
          assert.equal(2, rows.length);
          assert.deepEqual({'name': 'nono'}, rows[0]);
          assert.deepEqual({'name': 'nono'}, rows[1]);

          return db.delete().from(table).commit();
        }).then(() => {
          return db.select().from(table).commit();
        }).then((rows: Object[]) => {
          assert.equal(0, rows.length);
          return db.close();
        }, (e) => {
          console.error(e);
          throw e;
        });
  });
});