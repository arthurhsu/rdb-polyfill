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
import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';
import {Table} from '../../lib/spec/table';

const assert = chai.assert;

describe('Tx', () => {
  let conn: Sqlite3Connection;
  let db: Sqlite3Database;
  let foo: Table;

  beforeEach(() => {
    // Creates a new in-mem database each time.
    db = new Sqlite3Database();
    return db.open('bar').then(connection => {
      conn = connection as Sqlite3Connection;
      assert.isNotNull(conn);
      return conn.createTable('foo')
          .column('id', 'number')
          .column('name', 'string')
          .primaryKey('id')
          .commit();
    }).then(() => foo = conn.schema().table('foo'));
  });

  it('exec_simpleDML', () => {
    let q1 = conn.insert().into(foo).values({id: 1, name: '2'});
    let q2 = conn.update(foo).set(foo['name'], '3');
    return conn.createTransaction('readwrite').exec([q1, q2]).then(() => {
      return conn.select().from(foo).commit();
    }).then((res: object[]) => {
      assert.deepEqual({id: 1, name: '3'}, res[0]);
    });
  });

  it('exec_rollback', () => {
    let q1 = conn.insert().into(foo).values({id: 1, name: '2'});
    let q2 = conn.insert().into(foo).values({id: 1, name: '3'});
    return conn.createTransaction('readwrite').exec([q1, q2]).then(() => {
      throw new Error('NOTREACH: should not be here');
    }, e => {
      return conn.select().from(foo).commit();
    }).then((res: object[]) => {
      console.log(res);
      assert.equal(0, res.length);
    });
  });

  /*
  it('exec_SimpleDDL', () => {
    let bar = conn.createTable('bar')
                  .column('id', 'integer')
                  .column('name', 'string');
    let fuz = conn.createTable('fuz')
                  .column('id', 'integer')
                  .column('name', 'string');
    return conn.createTransaction('readwrite')
               .exec([bar, fuz])
               .then(() => {
                 assert.equal('bar', conn.schema().table('bar').getName());
                 assert.equal('fuz', conn.schema().table('fuz').getName());
               });
  });

  it('attach_SimpleDML', () => {
    let expected = 'begin transaction;' +
                   'insert into foo(id,name) values(1,"2");' +
                   'update foo set name="3";' +
                   'commit';
    let foo = conn.schema().table('foo');
    let tx = conn.createTransaction('readwrite');
    let q1 = conn.insert().into(foo).values({id: 1, name: '2'});
    let q2 = conn.update(foo).set(foo['name'], '3');
    return tx
        .begin()
        .then(() => tx.attach(q1))
        .then(() => tx.attach(q2))
        .then(() => tx.commit())
        .then(() => {
          assert.equal(expected, db.sqls.join(';'));
        });
  });

  it('attach_SimpleDDL', () => {
    let bar = conn.createTable('bar')
                  .column('id', 'integer')
                  .column('name', 'string');
    let fuz = conn.createTable('fuz')
                  .column('id', 'integer')
                  .column('name', 'string');
    let tx = conn.createTransaction('readwrite');
    return tx
        .begin()
        .then(() => tx.attach(bar))
        .then(() => tx.attach(fuz))
        .then(() => tx.commit())
        .then(() => {
          assert.equal('bar', conn.schema().table('bar').getName());
          assert.equal('fuz', conn.schema().table('fuz').getName());
        });
  });
  */
});
