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
import {SqlConnection} from '../../lib/proc/sql_connection';
import {Table} from '../../lib/spec/table';
import {getMockConnection} from '../../testing/mock_connection';

const assert = chai.assert;

describe('SelectQueryBuilder', () => {
  let foo: Table;
  let conn: SqlConnection;
  before(() => {
    conn = getMockConnection();
    foo = conn.schema().table('foo');
  });

  it('toSql_simple', () => {
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
    assert.equal(expected, selectBuilder.toSql());
  });

  it('toSql_simpleBind', () => {
    const expected = 'select * from foo where foo.boolean = 1 limit 2 skip 3';

    let bind = [conn.bind(0), conn.bind(1), conn.bind(2)];
    let selectBuilder =
        conn.select()
            .from(foo)
            .where(foo['boolean'].eq(bind[0]))
            .skip(bind[2])
            .limit(bind[1]) as
        SelectQueryBuilder;
    assert.equal(expected, selectBuilder.bind(true, 2, 3).toSql());
  });

  it('toSql_selfJoin', () => {
    const expected = 'select a.id, a.name from foo a, foo b' +
                     ' where (a.id = b.id) and (a.boolean = 1)';
    let a = foo.as('a');
    let b = foo.as('b');
    let selectBuilder =
        conn.select(a['id'], a['name'])
            .from(a, b)
            .where(a['id'].eq(b['id']).and(a['boolean'].eq(true)));
    assert.equal(expected, selectBuilder.toSql());
  });
});
