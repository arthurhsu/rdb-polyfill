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
import {UpdateQueryBuilder} from '../../lib/proc/update_query_builder';
import {Schema} from '../../lib/schema/schema';
import {TableBuilderPolyfill} from '../../lib/schema/table_builder_polyfill';

const assert = chai.assert;

describe('UpdateQueryBuilder', () => {
  let schema: Schema;
  before(() => {
    schema = new Schema('db', 1);
    let builder = new TableBuilderPolyfill(null, 'foo');
    builder.column('id', 'number')
        .column('name', 'string')
        .column('date', 'date')
        .column('boolean', 'boolean')
        .column('object', 'object');
    schema.tables.set('foo', builder.getSchema());
  });

  it('toSql_simple', () => {
    let now = new Date();
    const expected = 'update foo set name="bar", ' +
                     `date=${now.getTime()}, boolean=1 where foo.id = 1`;

    let foo = schema.tables.get('foo');
    let updateBuilder = new UpdateQueryBuilder(null, schema, foo);
    updateBuilder.set(foo['name'], 'bar')
                 .set(foo['date'], now)
                 .set(foo['boolean'], true)
                 .where(foo['id'].eq(1));
    assert.equal(expected, updateBuilder.toSql());
  });
});
