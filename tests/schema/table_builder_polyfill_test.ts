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
import {TableBuilderPolyfill} from '../../lib/schema/table_builder_polyfill';

const assert = chai.assert;

describe('TableBuilderPolyfill', () => {
  it('toSql_Simple', () => {
    const expected = 'create table foo (' +
                     'number real, ' +
                     'string text, ' +
                     'boolean integer, ' +
                     'date real, ' +
                     'object text not null, ' +
                     'blob blob' +
                     ')';
    let builder = new TableBuilderPolyfill(null, 'foo', 'db');
    builder.column('number', 'number')
        .column('string', 'string')
        .column('boolean', 'boolean')
        .column('date', 'date')
        .column('object', 'object', true)
        .column('blob', 'blob');
    assert.equal(expected, builder.toSql());
  });

  it('toSql_SinglePK', () => {
    const expected = 'create table foo (' +
                     'id real, ' +
                     'name text, ' +
                     'primary key (id)' +
                     ')';
    let builder = new TableBuilderPolyfill(null, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .primaryKey('id');
    assert.equal(expected, builder.toSql());
  });
});
