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
import {SqlConnection} from '../../lib/proc/sql_connection';
import {Table} from '../../lib/spec/table';
import {getMockConnection} from '../../testing/mock_connection';

const assert = chai.assert;

describe('DeleteQueryBuilder', () => {
  let foo: Table;
  let conn: SqlConnection;
  before(() => {
    conn = getMockConnection();
    foo = conn.schema().table('foo');
  });

  it('toSql_simple', () => {
    const expected = 'delete from foo';
    let deleteBuilder = conn.delete().from(foo) as DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql());
    assert.equal(expected, deleteBuilder.clone().toSql());
  });

  it('toSql_oneSearchCondition', () => {
    const expected = 'delete from foo where foo.boolean = 1';
    let deleteBuilder =
        conn.delete().from(foo).where(foo['boolean'].eq(true)) as
        DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql());
    assert.equal(expected, deleteBuilder.clone().toSql());
  });

  it('toSql_simpleAndSearchCondition', () => {
    const expected =
        'delete from foo where (foo.boolean = 1) and (foo.id = 1)';
    let deleteBuilder =
        conn.delete().from(foo)
            .where(foo['boolean'].eq(true).and(foo['id'].eq(1))) as
        DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql());
    assert.equal(expected, deleteBuilder.clone().toSql());
  });

  it('toSql_simpleOrUnbound', () => {
    const expected =
        'delete from foo where (foo.boolean = ?1) or (foo.id = ?0)';
    let deleteBuilder =
        conn.delete().from(foo)
            .where(foo['boolean'].eq(conn.bind(1)).or(
                foo['id'].eq(conn.bind(0)))) as DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql());
    assert.equal(expected, deleteBuilder.clone().toSql());
  });

  it('toSql_simpleAndBounded', () => {
    const expected =
        'delete from foo where (foo.boolean = 1) and (foo.id = 1)';
    let deleteBuilder =
        conn.delete().from(foo)
            .where(foo['boolean'].eq(conn.bind(1)).and(
                foo['id'].eq(conn.bind(0))))
            .bind(1, true) as DeleteQueryBuilder;
    assert.equal(expected, deleteBuilder.toSql());
    assert.equal(expected, deleteBuilder.clone().bind(1, true).toSql());
  });
});
