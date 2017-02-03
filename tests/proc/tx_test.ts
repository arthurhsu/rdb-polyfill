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
import {SqlConnection} from '../../lib/proc/sql_connection';
import {Schema} from '../../lib/schema/schema';
import {MockDB} from '../../testing/mock_db';

const assert = chai.assert;

describe('Tx', () => {
  let db: MockDB;
  let conn: SqlConnection;

  before(() => {
    db = new MockDB();
    conn = new SqlConnection(db, new Schema('db', 1));
    return conn.createTable('foo')
        .column('id', 'number')
        .column('name', 'string')
        .commit()
        .then(() => {
          db.clear();
        });
  });

  it('exec', () => {
    let expected = 'begin transaction;' +
                   'insert into foo(id,name) values(1,"2");' +
                   'update foo set name="3";' +
                   'commit';
    let foo = conn.schema().table('foo');
    let q1 = conn.insert().into(foo).values({id: 1, name: '2'});
    let q2 = conn.update(foo).set(foo['name'], '3');
    return conn
        .createTransaction('readwrite')
        .exec([q1, q2])
        .then(() => {
          assert.equal(expected, db.sqls.join(';'));
        });
  });
});
