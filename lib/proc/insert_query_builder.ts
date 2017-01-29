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
import {SqlExecutionContext} from './sql_execution_context';

export class InsertQueryBuilder extends QueryBase implements IInsertQuery {
  private replace: boolean;
  private table: TableSchema;
  private schema: Schema;
  private valueMap: Map<string, any>;

  constructor(context: SqlExecutionContext, schema: Schema, replace = false) {
    super(context);
    this.replace = replace;
    this.table = null;
    this.schema = schema;
    this.valueMap = new Map<string, any>();
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
    // TODO(arthurhsu): support multiple rows
    if (Array.isArray(rows)) {
      throw new Error('NotImplemented');
    }
    Object.keys(rows).forEach(key => {
      if (!this.table._columns.has(key)) {
        throw new Error('SyntaxError');
      }
      this.valueMap.set(key, rows[key]);
    });
    if (this.valueMap.size != this.table._columns.size) {
      throw new Error('SyntaxError');
    }
    return this;
  }

  public createBinderMap(): void {
    // TODO(arthurhsu): handle binder resolved into array
    this.valueMap.forEach(value => {
      if (value instanceof BindableValueHolder) {
        this.boundValues.set(value.index, value);
      }
    });
  }

  public clone(): IQuery {
    let that = new InsertQueryBuilder(this.context, this.schema, this.replace);
    that.table = this.table;
    that.valueMap = new Map<string, any>(this.valueMap);
    return that;
  }

  public toSql(): string {
    if (this.table === null || this.valueMap.size == 0) {
      throw new Error('SyntaxError');
    }

    // TODO(arthurhsu): implement INSERT OR REPLACE (SQLite dialect)
    let keys: string[] = [];
    let vals: string[] = [];
    this.valueMap.forEach((value, key) => {
      keys.push(key);
      vals.push(super.toValueString(value, this.table._columns.get(key).type));
    });
    return `insert into ${this.table._name}(${keys.join(',')}) ` +
        `values(${vals.join(',')})`;
  }
}
