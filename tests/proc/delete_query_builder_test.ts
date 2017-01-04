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
import {Schema} from '../../lib/schema/schema';
import {TableBuilderPolyfill} from '../../lib/schema/table_builder_polyfill';

const assert = chai.assert;

describe('DeleteQueryBuilder', () => {
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
    const expected = 'delete from foo';
    let deleteBuilder = new DeleteQueryBuilder(null, schema);
    deleteBuilder.from(schema.tables.get('foo'));
    assert.equal(expected, deleteBuilder.toSql());
  });
});
