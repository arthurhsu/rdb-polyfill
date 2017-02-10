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
import {MockConnection} from '../../testing/mock_connection';

const assert = chai.assert;

describe('UpdateQueryBuilder', () => {
  let foo: Table;
  let conn: MockConnection;
  before(() => {
    conn = new MockConnection();
    return conn.createFoo().then(() => foo = conn.schema().table('foo'));
  });

  it('toSql_simple', () => {
    let now = new Date();
    const expected = 'update foo set name="bar", ' +
                     `date=${now.getTime()}, boolean=1 where foo.id = 1`;

    let updateBuilder =
        conn.update(foo)
            .set(foo['name'], 'bar')
            .set(foo['date'], now)
            .set(foo['boolean'], true)
            .where(foo['id'].eq(1)) as UpdateQueryBuilder;
    assert.equal(expected, updateBuilder.toSql());
    assert.equal(expected, updateBuilder.clone().toSql());
  });
});
