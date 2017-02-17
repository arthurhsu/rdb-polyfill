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

import {ColumnType} from '../spec/enums';
import {IndexedColumnDefinition, IndexedColumnSpec, PrimaryKeyDefinition} from '../spec/table_builder';

// Common base methods for TableBuilder and TableChanger.
export class CommonBase {
  static getSqlType(type: ColumnType): string {
    switch (type) {
      case 'blob':
        return 'blob';

      case 'number':
      case 'date':
        return 'real';

      case 'boolean':
        return 'integer';

      case 'string':
      case 'object':
        return 'text';

      default:
        throw new Error('InvalidSchemaError');
    }
  }

  static columnDefToSql(name: string, type: ColumnType, notNull = false):
      string {
    let postfix = notNull ? ' not null' : '';
    let sqlType = CommonBase.getSqlType(type);
    return `${name} ${sqlType}${postfix}`;
  }

  static verifyColumnIsIndexable(
      name: string, columnType: Map<string, ColumnType>): void {
    let type = columnType.get(name);
    if (type == 'blob' || type == 'object' || type === undefined) {
      throw new Error('InvalidSchemaError');
    }
  }

  static normalizeIndex(
      index: PrimaryKeyDefinition|IndexedColumnDefinition,
      columnType: Map<string, ColumnType>): IndexedColumnSpec[] {
    let results: IndexedColumnSpec[] = [];
    if (typeof index == 'string') {
      CommonBase.verifyColumnIsIndexable(index, columnType);
      results.push({name: index, order: 'asc'});
    } else if (Array.isArray(index)) {
      if (typeof index[0] == 'string') {
        (index as string[]).forEach(k => {
          CommonBase.verifyColumnIsIndexable(k, columnType);
          results.push({'name': k, order: 'asc'});
        });
      } else {
        (index as IndexedColumnSpec[]).forEach(k => {
          CommonBase.verifyColumnIsIndexable(k.name, columnType);
          results.push(k);
        });
      }
    } else if (typeof index == 'object') {
      // This must be tested after Array.isArray(index), because type of Array
      // is 'object'.
      let i = index as IndexedColumnSpec;
      CommonBase.verifyColumnIsIndexable(i.name, columnType);
      results.push(i);
    } else {  // invalid type
      throw new Error('SyntaxError');
    }

    if (results.length == 0) {
      throw new Error('SyntaxError');
    }
    return results;
  }

  static indexToSql(prefix: string, index: IndexedColumnSpec[]): string {
    let columnSql = index
        .map(k => {
          return (k.order == 'asc') ? k.name : `${k.name} ${k.order}`;
        })
        .join(', ');
    return `${prefix} (${columnSql})`;
  }
}
