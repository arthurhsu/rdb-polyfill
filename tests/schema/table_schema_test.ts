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
import {ColumnSchema} from '../../lib/schema/column_schema';
import {TableBuilder} from '../../lib/schema/table_builder';
import {TableSchema} from '../../lib/schema/table_schema';

const assert = chai.assert;

describe('TableSchema', () => {
  function verifyColumns(table: TableSchema, alias?: string) {
    assert.equal('Foo', table.getName());
    if (alias) {
      assert.equal(alias, table.getAlias());
    }
    const colNames = ['a', 'b', 'd', 'i', 'n', 's', 'o'];
    const colTypes =
        ['blob', 'boolean', 'date', 'integer', 'number', 'string', 'object'];
    colNames.forEach((col, index) => {
      assert.isTrue(table[col] instanceof ColumnSchema);
      assert.equal(colTypes[index], table[col].type);
    });
  }

  // TODO(arthurhsu): test more indices and foreign key
  function verifyConstraints(table: TableSchema) {
    assert.deepEqual(['i'], table._primaryKey);
    assert.equal(true, table._autoIncrement);
  }

  it('defineCorrectly', () => {
    let t = new TableSchema('Foo');
    t.column('a', 'blob')
     .column('b', 'boolean')
     .column('d', 'date')
     .column('i', 'integer')
     .column('n', 'number')
     .column('s', 'string')
     .column('o', 'object');
    verifyColumns(t);
    verifyColumns(t.as('fool'), 'fool');
  });

  it('fromTableBuilder', () => {
    let tb = new TableBuilder(null, 'Foo', 'db');
    tb.column('a', 'blob')
      .column('b', 'boolean')
      .column('d', 'date')
      .column('i', 'integer')
      .column('n', 'number')
      .column('s', 'string')
      .column('o', 'object')
      .primaryKey('i', true)
      .index('idx_n', 'n');
    verifyColumns(tb.getSchema());
    verifyConstraints(tb.getSchema());
  });
});
