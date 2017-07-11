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
import {Database} from 'sqlite3';

import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';
import {Stmt} from '../../lib/proc/stmt';
import {RDBStorageType} from '../../lib/spec/relational_database';

const assert = chai.assert;

describe('Stmt', () => {
  let conn: Sqlite3Connection;
  let db: Database;

  before(() => {
    let opt = {
      storageType: 'temporary' as RDBStorageType,
      filePath: ':memory:'
    };
    return new Sqlite3Database().open('foo', opt).then(connection => {
      conn = connection as Sqlite3Connection;
      db = conn.getNativeDb();
    });
  });

  it('create', () => {
    let stmt = new Stmt(db, 'create table foo (name text);', false, false);
    let stmt2 = new Stmt(db,
        'select tbl_name from sqlite_master where tbl_name = "foo";',
        true, false);
    return stmt.run().then(() => {
      return stmt2.all();
    }).then((res: Object[]) => {
      assert.equal(1, res.length);
      assert.equal('foo', res[0]['tbl_name']);
    });
  });

  it('selectBind', () => {
    let stmt = new Stmt(db,
        'select tbl_name from sqlite_master where tbl_name = ?1;', true, true);
    return stmt.bind(['foo']).all().then((res: Object[]) => {
      assert.equal(1, res.length);
      assert.equal('foo', res[0]['tbl_name']);
    });
  });

  it('insertBind', () => {
    let stmt = new Stmt(db, 'insert into foo values(?1);', false, true);
    let check = new Stmt(db, 'select name from foo;', true, false);
    stmt.bind(['foo']);
    stmt.bind(['bar']);
    stmt.run().then(() => {
      return check.all();
    }).then((res: Object[]) => {
      assert.equal(2, res.length);
      assert.equal('foo', res[0]['name']);
      assert.equal('bar', res[1]['name']);
    });
  });
});