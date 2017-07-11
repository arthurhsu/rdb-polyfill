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
import {UpdateQueryBuilder} from '../../lib/proc/update_query_builder';
import {Table} from '../../lib/spec/table';
import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';

const assert = chai.assert;

describe('UpdateQueryBuilder', () => {
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

  it('update_simple', () => {
    let now = new Date();
    const expected = 'update foo set name="bag", ' +
                     `date=${now.getTime()}, boolean=1 where foo.id = 2;`;

    let updateBuilder =
        connection.update(foo)
            .set(foo['name'], 'bag')
            .set(foo['date'], now)
            .set(foo['boolean'], true)
            .where(foo['id'].eq(2)) as UpdateQueryBuilder;
    assert.equal(expected, updateBuilder.toSql()[0]);
    assert.equal(expected, updateBuilder.clone().toSql()[0]);
    updateBuilder.commit().then(() => {
      return connection.simpleGet('select * from foo where foo.id = 2;');
    }).then(res => {
      assert.equal(1, res.length);
      let row = res[0];
      assert.equal('bag', row['name'])
      assert.equal(now.getTime(), row['date']);
      assert.equal(1, row['boolean']);
    });
  });
});
