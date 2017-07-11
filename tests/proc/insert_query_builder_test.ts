/**
 * @license
 * Copyright 2016 The Lovefield Project Authors. All Rights Reserved.
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
import {InsertQueryBuilder} from '../../lib/proc/insert_query_builder';
import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';
import {Table} from '../../lib/spec/table';

const assert = chai.assert;

describe('InsertQueryBuilder', () => {
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

  afterEach(() => {
    return connection.simpleRun(['delete from foo;']);
  });

  it('insert_singleRow', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    const expected =
        'insert into foo(id,name,date,boolean,object) values(?,?,?,?,?);';

    let insertBuilder = connection.insert().into(foo).values({
      id: 1,
      name: 'bar',
      date: now,
      boolean: true,
      object: obj
    }) as InsertQueryBuilder;
    assert.equal(expected, insertBuilder.toSql()[0]);
    assert.equal(expected, insertBuilder.clone().toSql()[0]);
    return insertBuilder.commit().then(() => {
      return connection.simpleGet('select * from foo;');
    }).then(res => {
      assert.equal(1, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal('bar', res[0]['name']);
      assert.equal(1, res[0]['boolean']);
      assert.equal(now.getTime(), res[0]['date']);
      assert.equal(JSON.stringify(obj), res[0]['object']);
    });
  });

  it('insert_multiRow', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    const expected =
        'insert into foo(id,name,date,boolean,object) values(?,?,?,?,?);';

    let values = [
      {
        id: 1,
        name: 'bar',
        date: now,
        boolean: true,
        object: obj
      },
      {
        id: 2,
        name: 'ror',
        date: now,
        boolean: false,
        object: obj
      }
    ];
    let insertBuilder =
        connection.insert().into(foo).values(values) as InsertQueryBuilder;
    assert.equal(expected, insertBuilder.toSql()[0]);
    assert.equal(expected, insertBuilder.clone().toSql()[0]);
    return insertBuilder.commit().then(() => {
      return connection.simpleGet('select * from foo order by id;');
    }).then(res => {
      assert.equal(2, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal('bar', res[0]['name']);
      assert.equal(1, res[0]['boolean']);
      assert.equal(now.getTime(), res[0]['date']);
      assert.equal(JSON.stringify(obj), res[0]['object']);
      assert.equal(2, res[1]['id']);
      assert.equal('ror', res[1]['name']);
      assert.equal(0, res[1]['boolean']);
      assert.equal(now.getTime(), res[1]['date']);
      assert.equal(JSON.stringify(obj), res[1]['object']);
    });
  });

  it('insert_bindSingleRow', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    let wildcard = connection.bind(0);
    let insertBuilder =
        connection.insert().into(foo).values(wildcard) as InsertQueryBuilder;
    insertBuilder.bind({
      id: 1,
      name: 'bar',
      date: now,
      boolean: true,
      object: obj
    });
    return insertBuilder.commit().then(() => {
      return connection.simpleGet('select * from foo;');
    }).then(res => {
      assert.equal(1, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal('bar', res[0]['name']);
      assert.equal(1, res[0]['boolean']);
      assert.equal(now.getTime(), res[0]['date']);
      assert.equal(JSON.stringify(obj), res[0]['object']);
    });
  });

  it('insert_bindMultiRow', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    let wildcard = connection.bind(0);
    let values = [
      {
        id: 1,
        name: 'bar',
        date: now,
        boolean: true,
        object: obj
      },
      {
        id: 2,
        name: 'ror',
        date: now,
        boolean: false,
        object: obj
      }
    ];
    let insertBuilder =
        connection.insert().into(foo).values(wildcard) as InsertQueryBuilder;
    insertBuilder.bind(values);
    return insertBuilder.commit().then(() => {
      return connection.simpleGet('select * from foo order by id;');
    }).then(res => {
      assert.equal(2, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal('bar', res[0]['name']);
      assert.equal(1, res[0]['boolean']);
      assert.equal(now.getTime(), res[0]['date']);
      assert.equal(JSON.stringify(obj), res[0]['object']);
      assert.equal(2, res[1]['id']);
      assert.equal('ror', res[1]['name']);
      assert.equal(0, res[1]['boolean']);
      assert.equal(now.getTime(), res[1]['date']);
      assert.equal(JSON.stringify(obj), res[1]['object']);
    });
  });

  it('replace', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    const expected =
        'insert or replace into foo(id,name,date,boolean,object) ' +
        'values(?,?,?,?,?);';

    let wildcard = connection.bind(0);
    let insertBuilder =
        connection.insertOrReplace().into(foo).values(wildcard) as
            InsertQueryBuilder;
    assert.equal(expected, insertBuilder.toSql()[0]);
    assert.equal(expected, insertBuilder.clone().toSql()[0]);
    insertBuilder.bind({
      id: 1,
      name: 'bar',
      date: now,
      boolean: true,
      object: obj
    });
    return insertBuilder.commit().then(() => {
      return connection.simpleGet('select * from foo;');
    }).then(res => {
      assert.equal(1, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal('bar', res[0]['name']);
      assert.equal(1, res[0]['boolean']);
      assert.equal(now.getTime(), res[0]['date']);
      assert.equal(JSON.stringify(obj), res[0]['object']);

      insertBuilder.bind({
        id: 1,
        name: 'bar2',
        date: now,
        boolean: false,
        object: obj
      });
      return insertBuilder.commit();
    }).then(res => {
      return connection.simpleGet('select * from foo;');
    }).then(res => {
      assert.equal(1, res.length);
      assert.equal(1, res[0]['id']);
      assert.equal('bar2', res[0]['name']);
      assert.equal(0, res[0]['boolean']);
      assert.equal(now.getTime(), res[0]['date']);
      assert.equal(JSON.stringify(obj), res[0]['object']);
    });
  });
});
