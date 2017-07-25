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
      assert.equal(0, res.length);
    });
  });

  it('exec_simpleDDL', () => {
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

  it('attach_simpleDML', () => {
    let tx = conn.createTransaction('readwrite');
    let q1 = conn.insert().into(foo).values({id: 1, name: '2'});
    let q2 = conn.update(foo).set(foo['name'], '3');
    let q3 = conn.select().from(foo);
    let checker = (res: object[], name: string) => {
      assert.equal(1, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal(name, res[0]['name']);
    };

    return tx
        .begin()
        .then(() => tx.attach(q1))
        .then(() => tx.attach(q3))
        .then(res => checker((res as object[]), '2'))
        .then(() => tx.attach(q2))
        .then(() => tx.attach(q3))
        .then(res => checker((res as object[]), '3'))
        .then(() => tx.rollback())
        .then(() => q3.commit())
        .then((res: object[]) => {
          assert.equal(0, res.length);
        });
  });

  it('throws_attach_DDL', () => {
    let bar = conn.createTable('bar')
                  .column('id', 'integer')
                  .column('name', 'string');
    let tx = conn.createTransaction('readwrite');
    return tx
        .begin()
        .then(() => {
          assert.throws(() => {
            tx.attach(bar);
          });
        });
  });
});
