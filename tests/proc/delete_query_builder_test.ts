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
import {DeleteQueryBuilder} from '../../lib/proc/delete_query_builder';
import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';
import {Table} from '../../lib/spec/table';

const assert = chai.assert;

describe('DeleteQueryBuilder', () => {
  let foo: Table;
  let connection: Sqlite3Connection;
  let db: Sqlite3Database;

  before(() => {
    db = new Sqlite3Database();
    return db.open('bar').then(conn => {
      connection = conn as Sqlite3Connection;
      assert.isNotNull(connection);
      return connection.createTable('foo')
          .column('id', 'number')
          .column('name', 'string')
          .column('date', 'date')
          .column('boolean', 'boolean')
          .column('object', 'object')
          .primaryKey('id')
          .commit();
    }).then(() => foo = connection.schema().table('foo'));
  });

  function checkRowCount(count: number): Promise<void> {
    return connection.simpleGet('select count(*) from foo;').then(res => {
      assert.equal(count, res[0]['count(*)']);
    });
  }

  beforeEach(() => {
    return connection.simpleRun([
      'insert into foo values(1, "bar", 1499466194434, 1, null);',
      'insert into foo values(2, "baz", 1499466194438, 0, null);'
    ]).then(() => {
      return checkRowCount(2);
    });
  });

  afterEach(() => {
    return connection.simpleRun(['delete from foo;']);
  });

  it('delete_all', () => {
    const expected = 'delete from foo;';
    let deleteBuilder = connection.delete().from(foo) as DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql()[0]);
    assert.equal(expected, deleteBuilder.clone().toSql()[0]);
    deleteBuilder.commit().then(() => {
      return checkRowCount(0);
    });
  });

  it('delete_oneSearchCondition', () => {
    const expected = 'delete from foo where foo.boolean = 1;';
    let deleteBuilder =
        connection.delete().from(foo).where(foo['boolean'].eq(true)) as
        DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql()[0]);
    assert.equal(expected, deleteBuilder.clone().toSql()[0]);
    deleteBuilder.commit().then(() => {
      return checkRowCount(1);
    });
  });

  it('delete_simpleAndSearchCondition', () => {
    const expected =
        'delete from foo where (foo.boolean = 1) and (foo.id = 1);';
    let deleteBuilder =
        connection.delete().from(foo)
            .where(foo['boolean'].eq(true).and(foo['id'].eq(1))) as
        DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql()[0]);
    assert.equal(expected, deleteBuilder.clone().toSql()[0]);
    deleteBuilder.commit().then(() => {
      return checkRowCount(1);
    });
  });

  it('delete_simpleOrUnbound', () => {
    const expected =
        'delete from foo where (foo.boolean = ?2) or (foo.id = ?1);';
    let deleteBuilder =
        connection.delete().from(foo)
            .where(foo['boolean'].eq(connection.bind(1)).or(
                foo['id'].eq(connection.bind(0)))) as DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql()[0]);
    assert.equal(expected, deleteBuilder.clone().toSql()[0]);
  });

  it('delete_simpleAndBounded', () => {
    const expected =
        'delete from foo where (foo.boolean = ?2) and (foo.id = ?1);';
    let deleteBuilder =
        connection.delete().from(foo)
            .where(foo['boolean'].eq(connection.bind(1)).and(
                foo['id'].eq(connection.bind(0))))
            .bind(1, true) as DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql()[0]);
    assert.equal(expected, deleteBuilder.clone().bind(1, true).toSql()[0]);
    deleteBuilder.commit().then(() => {
      // Nothing match, should still have two rows.
      return checkRowCount(2);
    });
  });
});
