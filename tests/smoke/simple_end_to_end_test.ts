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
import {SqlDatabase} from '../../lib/proc/sql_database';
import {DatabaseConnection} from '../../lib/spec/database_connection';
import {Table} from '../../lib/spec/table';

const assert = chai.assert;

describe('SimpleEndToEnd', () => {
  it('simple_SCUD', () => {
    let db = new SqlDatabase('./out');
    let connection: DatabaseConnection = null;
    let payload = {'id': 1, 'name': 'what'};
    let table: Table = null;
    return db.open('foo', {storageType: 'temporary'})
      .then((conn) => {
        assert.isNotNull(conn);
        connection = conn;
        return connection.createTable('foo')
                         .column('id', 'number')
                         .column('name', 'string')
                         .commit();
      }).then(() => {
        table = connection.schema().table('foo');
        return connection.insert().into(table).values(payload).commit();
      }).then(() => {
        return connection.select().from(table)
                                  .where(table['id'].eq(1))
                                  .commit();
      }).then((rows: Object[]) => {
        assert.equal(1, rows.length);
        assert.deepEqual(payload, rows[0]);
        return connection.update(table).set(table['name'], 'nono').commit();
      }).then(() => {
        return connection.select(table['name']).from(table).commit();
      }).then((rows: Object[]) => {
        assert.equal(1, rows.length);
        assert.deepEqual({'name': 'nono'}, rows[0]);

        return connection.delete().from(table).commit();
      }).then(() => {
        return connection.select().from(table).commit();
      }).then((rows: Object[]) => {
        assert.equal(0, rows.length);
        return connection.close();
      }, (e) => {
        console.error(e);
        throw e;
      });
  });
});