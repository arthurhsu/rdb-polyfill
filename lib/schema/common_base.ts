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
import {SqlConnection} from '../proc/sql_connection';
import {AutoIncrementPrimaryKey, IndexedColumnSpec, PrimaryKeyDefinition} from '../spec/table_builder';

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

  static primaryKeyToSql(
      cnn: SqlConnection, primaryKey: PrimaryKeyDefinition): string {
    if (typeof primaryKey == 'string') {
      return `primary key (${primaryKey})`;
    }

    if (Array.isArray(primaryKey)) {
      if (primaryKey.length == 0) {
        throw new Error('SyntaxError');
      }

      if (typeof primaryKey[0] == 'string') {
        return `primary key (${primaryKey.join(' ')})`;
      }

      // IndexedColumnSpec[]
      let spec = (primaryKey as IndexedColumnSpec[]).map(k => {
        return `${k.name} ${k.order}`;
      }).join(',');
      return `primary key (${spec})`;
    } else {
      if (primaryKey['autoIncrement'] !== undefined) {
        let pk: AutoIncrementPrimaryKey = primaryKey as AutoIncrementPrimaryKey;
        return pk.autoIncrement ?
            `${pk.name} integer primary key ${cnn.autoIncrementKeyword}` :
            `primary key (${pk.name})`;
      } else {  // IndexedColumnSpec
        let pk: IndexedColumnSpec = primaryKey as IndexedColumnSpec;
        return `primary key (${pk.name} ${pk.order})`;
      }
    }
  }
}
