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
import {Order} from '../../lib/spec/enums';
import {SqlConnection} from '../../lib/proc/sql_connection';
import {SqlDatabase} from '../../lib/proc/sql_database';
import {Schema} from '../../lib/schema/schema';
import {TableSchema} from '../../lib/schema/table_schema';

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
    assert.equal('integer', table['integer'].type);
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
          .column('integer', 'integer')
          .column('number', 'number')
          .column('string', 'string')
          .column('object', 'object')
          .commit();
    }).then(() => {
      checkSchema(dbName, db.schema() as Schema);
      return inst2.open(dbName);
    }).then(db2 => {
      checkSchema(dbName, db2.schema() as Schema);
      return Promise.all([db2.close(), db.close()]);
    }).then(() => {
      inst.drop(dbName);  // Ignore the results.
    });
  });

  it('setVersion_persisting', () => {
    let dbName = new Date().getTime().toString();
    let inst = new SqlDatabase('out');
    let inst2 = new SqlDatabase('out');
    let db: SqlConnection;
    return inst.open(dbName).then(conn => {
      db = conn as SqlConnection;
      return db.setVersion(1).commit();
    }).then(() => {
      assert.equal(1, db.schema().version);
      return inst2.open(dbName);
    }).then(db2 => {
      assert.equal(1, db2.schema().version);
      return Promise.all([db2.close(), db.close()]);
    }).then(() => {
      inst.drop(dbName);
    });
  });

  it('dropTable_persisting', () => {
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
          .column('integer', 'integer')
          .column('number', 'number')
          .column('string', 'string')
          .column('object', 'object')
          .commit();
    }).then(() => {
      checkSchema(dbName, db.schema() as Schema);
      return db.dropTable('foo').commit();
    }).then(() => {
      assert.isUndefined(db.schema().table('foo'));
      return inst2.open(dbName);
    }).then(db2 => {
      assert.isUndefined(db2.schema().table('foo'));
      return Promise.all([db.close(), db2.close()]);
    }).then(() => {
      inst.drop(dbName);  // Ignore the results
    });
  });

  it('autoPK_persisting', () => {
    let dbName = new Date().getTime().toString();
    let inst = new SqlDatabase('out');
    let inst2 = new SqlDatabase('out');
    let db: SqlConnection;
    return inst.open(dbName).then(conn => {
      db = conn as SqlConnection;
      return db.createTable('foo')
          .column('id', 'integer')
          .column('number', 'number')
          .column('string', 'string')
          .primaryKey('id', true)
          .commit();
    }).then(() => {
      return inst2.open(dbName);
    }).then(db2 => {
      let tableSchema = db2.schema().table('foo') as any as TableSchema;
      assert.isTrue(tableSchema._autoIncrement);
      assert.deepEqual(['id'], tableSchema._primaryKey);
      return Promise.all([db.close(), db2.close()]);
    }).then(() => {
      inst.drop(dbName);  // Ignore the results
    });
  });

  it('crossColumnPK_persisting', () => {
    let dbName = new Date().getTime().toString();
    let inst = new SqlDatabase('out');
    let inst2 = new SqlDatabase('out');
    let db: SqlConnection;
    return inst.open(dbName).then(conn => {
      db = conn as SqlConnection;
      return db.createTable('foo')
          .column('number', 'number')
          .column('string', 'string')
          .primaryKey(['number', 'string'])
          .commit();
    }).then(() => {
      return inst2.open(dbName);
    }).then(db2 => {
      let tableSchema = db2.schema().table('foo') as any as TableSchema;
      assert.isFalse(tableSchema._autoIncrement);
      assert.deepEqual(['number', 'string'], tableSchema._primaryKey);
      return Promise.all([db.close(), db2.close()]);
    }).then(() => {
      inst.drop(dbName);  // Ignore the results
    });
  });

  it('index_persisting', () => {
    let dbName = new Date().getTime().toString();
    let inst = new SqlDatabase('out');
    let inst2 = new SqlDatabase('out');
    let db: SqlConnection;
    let desc: Order = 'desc';
    let asc: Order = 'asc';
    let colSpec = [{name: 'n2', order: desc}, {name: 'n3', order: asc}];
    return inst.open(dbName).then(conn => {
      db = conn as SqlConnection;
      return db.createTable('foo')
          .column('n1', 'number')
          .column('n2', 'number')
          .column('n3', 'number')
          .index('idx_n1', 'n1', true)
          .index('idx_n2n3', colSpec)
          .commit();
    }).then(() => {
      return inst2.open(dbName);
    }).then(db2 => {
      let tableSchema = db2.schema().table('foo') as any as TableSchema;
      assert.equal(2, tableSchema._indices.length);
      let n1 = tableSchema._indices.filter(
          index => (index.name == 'idx_n1'))[0];
      assert.isTrue(n1.unique);
      assert.equal('n1', n1.column[0].name);
      let n2n3 = tableSchema._indices.filter(
          index => (index.name == 'idx_n2n3'))[0];
      assert.isFalse(n2n3.unique);
      assert.deepEqual(colSpec, n2n3.column);
      return Promise.all([db.close(), db2.close()]);
    }).then(() => {
      inst.drop(dbName);  // Ignore the results
    });
  });

  it('foreignKey_persisting', () => {
    let dbName = new Date().getTime().toString();
    let inst = new SqlDatabase('out');
    let inst2 = new SqlDatabase('out');
    let db: SqlConnection;
    return inst.open(dbName).then(conn => {
      db = conn as SqlConnection;
      let tx = db.createTransaction('readwrite');
      let q1 = db.createTable('bar')
          .column('id', 'string')
          .column('desc', 'string')
          .primaryKey('id');
      let q2 = db.createTable('foo')
          .column('bid', 'string')
          .column('string', 'string')
          .foreignKey('fk_bid', 'bid', 'bar.id');
      let q3 = db.setVersion(1);
      return tx.exec([q1, q2, q3]);
    }).then(() => {
      return inst2.open(dbName);
    }).then(db2 => {
      let tableSchema = db2.schema().table('foo') as any as TableSchema;
      assert.equal(1, tableSchema._foreignKey.length);
      let fk = tableSchema._foreignKey[0];
      assert.equal('fk_bid', fk.name);
      assert.equal('bid', fk.local[0]);
      assert.equal('bar.id', fk.remote[0]);
      assert.equal('restrict', fk.action);
      assert.equal('immediate', fk.timing);
      return Promise.all([db.close(), db2.close()]);
    }).then(() => {
      inst.drop(dbName);  // Ignore the results
    });
  });
});
