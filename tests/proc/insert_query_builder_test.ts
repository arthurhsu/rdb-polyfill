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
import {SqlConnection} from '../../lib/proc/sql_connection';
import {Table} from '../../lib/spec/table';
import {getMockConnection} from '../../testing/mock_connection';

const assert = chai.assert;

describe('InsertQueryBuilder', () => {
  let foo: Table;
  let conn: SqlConnection;
  before(() => {
    conn = getMockConnection();
    foo = conn.schema().table('foo');
  });

  it('toSql_simple', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    const expected = 'insert into foo(id,name,date,boolean,object) values(' +
                     `1,"bar",${now.getTime()},1,"${JSON.stringify(obj)}")`;

    let insertBuilder = conn.insert().into(foo).values({
      id: 1,
      name: 'bar',
      date: now,
      boolean: true,
      object: obj
    }) as InsertQueryBuilder;
    assert.equal(expected, insertBuilder.toSql());
  });

  it('toSql_multiRow', () => {
    let now = new Date();
    let obj = {foo: 1, bar: 2};
    const expected = 'insert into foo(id,name,date,boolean,object) values(' +
                     `1,"bar",${now.getTime()},1,"${JSON.stringify(obj)}");\n` +
                     'insert into foo(id,name,date,boolean,object) values(' +
                     `2,"ror",${now.getTime()},0,"${JSON.stringify(obj)}")`;

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
        conn.insert().into(foo).values(values) as InsertQueryBuilder;
    assert.equal(expected, insertBuilder.toSql());
  });
});
