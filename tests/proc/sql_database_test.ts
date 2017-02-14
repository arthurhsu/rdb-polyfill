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
import {SqlDatabase} from '../../lib/proc/sql_database';
import {Schema} from '../../lib/schema/schema';

const assert = chai.assert;

describe('SqlDatabase', () => {
  function checkSchema(dbName: string, s: Schema): void {
    assert.equal(dbName, s.name);
    assert.equal(0, s.version);
    let table = s.table('foo');
    assert.equal('foo', table.getName());
    assert.equal('blob', table['blob'].type);
    assert.equal('boolean', table['boolean'].type);
    assert.equal('date', table['date'].type);
    assert.equal('number', table['number'].type);
    assert.equal('string', table['string'].type);
    assert.equal('object', table['object'].type);
  }

  it('createTable_persisting', () => {
    // Use a different named space so that the shared memory will not blocking
    // the tests shall anything failed.
    let dbName = new Date().getTime().toString();
    let inst = new SqlDatabase('out');
    let inst2 = new SqlDatabase('out');
    let db: SqlConnection;
    return inst.open(dbName).then(conn => {
      db = conn as SqlConnection;
      return db.createTable('foo')
          .column('blob', 'blob')
          .column('boolean', 'boolean')
          .column('date', 'date')
          .column('number', 'number')
          .column('string', 'string')
          .column('object', 'object')
          .commit();
    }).then(() => {
      checkSchema(dbName, db.schema() as Schema);
      return inst2.open(dbName);
    }).then(db2 => {
      checkSchema(dbName, db2.schema() as Schema);
      return db2.close();
    }).then(() => {
      return db.close();
    }).then(() => {
      inst.drop(dbName);  // Ignore the results.
    });
  });
});
