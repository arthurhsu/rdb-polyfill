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
import {SelectQueryBuilder} from '../../lib/proc/select_query_builder';
import {Sqlite3Connection} from '../../lib/proc/sqlite3_connection';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';
import {Table} from '../../lib/spec/table';

const assert = chai.assert;

describe('SelectQueryBuilder', () => {
  let foo: Table;
  let conn: Sqlite3Connection;
  let db: Sqlite3Database;

  before(() => {
    db = new Sqlite3Database();
    return db.open('bar').then(connection => {
      conn = connection as Sqlite3Connection;
      assert.isNotNull(connection);
      return connection.createTable('foo')
          .column('id', 'number')
          .column('name', 'string')
          .column('date', 'date')
          .column('boolean', 'boolean')
          .column('object', 'object')
          .primaryKey('id')
          .commit();
    }).then(() => {
      foo = conn.schema().table('foo');
      return conn.simpleRun([
        'insert into foo values(1, "bar", 1499466194434, 1, null);',
        'insert into foo values(2, "baz", 1499466194438, 0, null);'
      ]);
    }).then(() => {
      return conn.simpleGet('select count(*) from foo;')
    }).then(res => {
      assert.equal(2, res[0]['count(*)']);
    });
  });

  it('select_toSql_simple', () => {
    const expected =
        'select * from foo where foo.boolean = 1' +
        ' order by foo.id asc, foo.name desc' +
        ' group by foo.date';

    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['boolean'].eq(true))
            .orderBy(foo['id'])
            .orderBy(foo['name'], 'desc')
            .groupBy(foo['date']) as SelectQueryBuilder;
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_simpleBind', () => {
    const expected =
        'select * from foo where foo.boolean = ?1 limit ?2 skip ?3';

    let bind = [conn.bind(0), conn.bind(1), conn.bind(2)];
    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['boolean'].eq(bind[0]))
            .skip(bind[2])
            .limit(bind[1]) as
        SelectQueryBuilder;
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.bind(false, 3, 2).toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_selfJoin', () => {
    const expected = 'select a.id, a.name from foo a, foo b' +
                     ' where (a.id = b.id) and (a.boolean = 1)';
    let a = foo.as('a');
    let b = foo.as('b');
    let selectBuilder =
        conn.select(a['id'], a['name'])
            .from(a, b)
            .where(a['id'].eq(b['id']).and(a['boolean'].eq(true)));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_subquery', () => {
    const expected =
        'select foo.id from foo where foo.boolean = 1 union ' +
        '(select foo.id from foo where foo.name = "b" intersect ' +
        '(select foo.id from foo where foo.boolean = 0))';
    let selectBuilder =
        conn.select(foo['id']).from(foo).where(foo['boolean'].eq(true))
            .union(
                conn.select(foo['id']).from(foo).where(foo['name'].eq('b'))
                    .intersect(
                        conn.select(foo['id']).from(foo)
                            .where(foo['boolean'].eq(false))
                    )
            );
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_avg', () => {
    const expected = 'select avg(foo.id) from foo where foo.boolean = 1';
    let selectBuilder =
        conn.select(db.fn.avg(foo['id']))
            .from(foo)
            .where(foo['boolean'].eq(true));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_count', () => {
    const expected =
        'select count(foo.id), count(*) from foo where foo.boolean = 1';
    let selectBuilder =
        conn.select(db.fn.count(foo['id']), db.fn.count())
            .from(foo)
            .where(foo['boolean'].eq(true));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_distinct', () => {
    const expected = 'select distinct foo.name from foo';
    let selectBuilder = conn.select(db.fn.distinct(foo['name'])).from(foo);
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_innerJoin', () => {
    const expected = 'select a.id, a.name from foo a' +
                     ' inner join foo b on b.id = a.id where a.boolean = 1';
    let a = foo.as('a');
    let b = foo.as('b');
    let selectBuilder =
        conn.select(a['id'], a['name'])
            .from(a)
            .innerJoin(b, b['id'].eq(a['id']))
            .where(a['boolean'].eq(true));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_startsWith', () => {
    const expected = 'select * from foo where foo.name like "bar%"';
    let selectBuilder =
        conn.select().from(foo).where(foo['name'].startsWith('bar'));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_endsWith', () => {
    const expected = 'select * from foo where foo.name like "%bar"';
    let selectBuilder =
        conn.select().from(foo).where(foo['name'].endsWith('bar'));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_betweenBinder', () => {
    const expected = 'select * from foo where foo.id between ?1 and ?2';
    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['id'].between(conn.bind(0), conn.bind(1)));
    assert.equal(expected, selectBuilder.bind(1, 10).toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_in', () => {
    const expected = 'select * from foo where foo.id in (1, 2, 3, 4, 5)';
    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['id'].in([1, 2, 3, 4, 5]));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });

  it('select_toSql_inBinder', () => {
    const expected = 'select * from foo where foo.id in (?1)';
    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['id'].in(conn.bind(0)));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
    assert.equal(expected, selectBuilder.bind(6).toSql()[0]);
    assert.equal(expected, selectBuilder.clone().bind(6).toSql()[0]);
  });

  it('select_toSql_inSubquery', () => {
    const expected =
        'select * from foo where foo.id in (select foo.id from foo)';
    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['id'].in(conn.select(foo['id']).from(foo)));
    assert.equal(expected, selectBuilder.toSql()[0]);
    assert.equal(expected, selectBuilder.clone().toSql()[0]);
  });
});
