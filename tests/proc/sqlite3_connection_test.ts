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
import {Resolver} from '../../lib/base/resolver';
import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';

const assert = chai.assert;

describe('Sqlite3Connection', () => {
  it('simpleRunAndGet', () => {
    let connection: Sqlite3Connection = null;
    let db = new Sqlite3Database();
    return db.open('bar').then(conn => {
      connection = conn as Sqlite3Connection;
      assert.isNotNull(connection);
      return connection.simpleRun(['create table foo(id text);']);
    }).then(() => {
      return connection.simpleGet(
          'select tbl_name from sqlite_master where type="table" and ' +
          'tbl_name="foo";');
    }).then(res => {
      assert.equal('foo', res[0]['tbl_name']);
      return connection.simpleGet('pragma foreign_keys;');
    }).then(res => {
      assert.equal(1, res[0]['foreign_keys']);
    });
  });

  it('init_Empty', () => {
    let connection: Sqlite3Connection = null;
    let db = new Sqlite3Database();
    return db.open('bar').then(conn => {
      connection = conn as Sqlite3Connection;
      assert.isNotNull(connection.schema());
      assert.equal(0, connection.schema().version);
      return connection.simpleGet(
          'select count(tbl_name) from sqlite_master where type="table" and ' +
          'tbl_name like "$rdb_%";');
    }).then(res => {
      assert.equal(
          Sqlite3Connection.NUM_SPECIAL_TABLE, res[0]['count(tbl_name)']);
    });
  });

  it('handlesComplexSchema', () => {
    // TODO(arthurhsu): implement HR schema test.
  });

  function factCheck(conn: Sqlite3Connection, sql: string,
      checker: (res: Object[]) => void): Promise<void> {
    let resolver = new Resolver<void>();
    conn.simpleGet(sql).then(res => {
      checker(res);
      resolver.resolve();
    });
    return resolver.promise;
  }

  it('createTable', () => {
    let connection: Sqlite3Connection = null;
    let db = new Sqlite3Database();
    return db.open('bar2').then(conn => {
      connection = conn as Sqlite3Connection;
      return connection
          .createTable('foo')
          .column('id', 'string')
          .column('name', 'string')
          .primaryKey('id')
          .index('idx_Name', 'name')
          .commit();
    }).then(() => {
      // check foo table actually existed on DB
      return connection.simpleGet(
          'select tbl_name from sqlite_master where type="table" and ' +
          'tbl_name="foo";');
    }).then(res => {
      assert.equal(1, res.length);
      assert.equal('foo', res[0]['tbl_name']);

      // check schema has new foo table
      let foo = connection.schema().table('foo');
      assert.isDefined(foo);
      assert.isNotNull(foo);
      assert.equal('foo.id', foo.id.fullName);

      // check book-keepings are correct
      return factCheck(connection, 'select name, db from "$rdb_table";', res => {
        assert.equal(1, res.length);
        assert.equal('foo', res[0]['name']);
        assert.equal('bar2', res[0]['db']);
      });
    }).then(() => {
      return factCheck(connection, 'select * from "$rdb_column";', res => {
        assert.equal(2, res.length);
        assert.equal('id', res[0]['name']);
        assert.equal('bar2', res[0]['db']);
        assert.equal('foo', res[0]['tbl']);
        assert.equal('string', res[0]['type']);
        assert.equal(1, res[0]['nnull']);
        assert.equal('name', res[1]['name']);
        assert.equal('bar2', res[1]['db']);
        assert.equal('foo', res[1]['tbl']);
        assert.equal('string', res[1]['type']);
        assert.equal(0, res[1]['nnull']);
      });
    }).then(() => {
      return factCheck(connection, 'select * from "$rdb_relation";', res => {
        assert.equal(2, res.length);
        assert.equal('pk', res[0]['name']);
        assert.equal('bar2', res[0]['db']);
        assert.equal('foo', res[0]['tbl']);
        assert.equal('pk', res[0]['type']);
        assert.equal('id', res[0]['columns']);
        assert.equal('idx_Name', res[1]['name']);
        assert.equal('bar2', res[1]['db']);
        assert.equal('foo', res[1]['tbl']);
        assert.equal('index', res[1]['type']);
        assert.equal('[{\'name\':\'name\',\'order\':\'asc\'}]', res[1]['columns']);
      });
    });
  });
});