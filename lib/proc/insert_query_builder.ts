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

import {BindableValueHolder} from '../schema/bindable_value_holder';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {IBindableValue} from '../spec/bindable_value';
import {IInsertQuery} from '../spec/insert_query';
import {IQuery} from '../spec/query';
import {ITable} from '../spec/table';
import {QueryBase} from './query_base';
import {SqlConnection} from './sql_connection';

export class InsertQueryBuilder extends QueryBase implements IInsertQuery {
  private replace: boolean;
  private table: TableSchema;
  private schema: Schema;
  private value: Object|Object[];

  constructor(connection: SqlConnection, schema: Schema, replace = false) {
    super(connection);
    this.replace = replace;
    this.table = null;
    this.schema = schema;
  }

  public into(table: ITable): IInsertQuery {
    if (this.table !== null) {
      throw new Error('SyntaxError');
    }

    this.table = table as TableSchema;
    if (this.replace && this.table._primaryKey === null) {
      throw new Error('IntegrityError');
    }
    return this;
  }

  public values(rows: Object|Object[]|IBindableValue): IInsertQuery {
    if (rows instanceof BindableValueHolder) {
      this.boundValues.set(rows.index, rows);
    } else {
      this.value = rows;
    }
    return this;
  }

  public createBinderMap(): void {
    // Do nothing, already handled in values().
  }

  public clone(): IQuery {
    let that =
        new InsertQueryBuilder(this.connection, this.schema, this.replace);
    that.table = this.table;
    that.value = this.value;
    that.cloneBoundValues(this);
    return that;
  }

  private getValueString(keys: string[], value: Object): string {
    return keys
        .map(key => {
          let type = this.table._columns.get(key).type;
          return super.toValueString(value[key], type);
        })
        .join(',');
  }

  private getSingleSql(key: string, val: string): string {
    let prefix = this.replace ? 'insert or replace' : 'insert';
    return `${prefix} into ${this.table._name}(${key}) values(${val})`;
  }

  public toSql(): string {
    if (this.table === null ||
        (this.value === undefined && this.boundValues.size == 0)) {
      throw new Error('SyntaxError');
    }

    let keys = Array.from(this.table._columns.keys());
    let keyString = keys.join(',');
    if (Array.isArray(this.value)) {
      return this.value
          .map(v => this.getSingleSql(keyString, this.getValueString(keys, v)))
          .join(';\n');
    } else {
      return this.getSingleSql(
          keyString, this.getValueString(keys, this.value));
    }
  }
}
