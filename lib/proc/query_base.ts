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
import {ColumnType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {SqlConnection} from './sql_connection';
import {SqlExecutionContext} from './sql_execution_context';

export abstract class QueryBase implements IQuery {
  protected connection: SqlConnection;
  protected context: SqlExecutionContext;
  protected boundValues: Map<number, BindableValueHolder>;
  protected finalized: boolean;

  constructor(connection: SqlConnection) {
    this.connection = connection;
    this.context = null;
    this.finalized = false;
    this.boundValues = new Map<number, BindableValueHolder>();
  }

  public attach(context: SqlExecutionContext): void {
    this.context = context;
  }

  public explain(): Promise<string> {
    return Promise.resolve('Explain not implemented');
  }

  public bind(...values: any[]): IQuery {
    if (this.boundValues.size == 0) {
      this.createBinderMap();
    }

    if (this.boundValues.size > 0) {
      for (let i = 0; i < values.length; ++i) {
        if (this.boundValues.has(i)) {
          this.boundValues.get(i).bind(values[i]);
        }
      }
    }
    return this;
  }

  abstract createBinderMap(): void;
  abstract clone(): IQuery;
  abstract toSql(): string;

  protected cloneBoundValues(source: QueryBase): void {
    source.boundValues.forEach((val, key) => {
      this.boundValues.set(key, val.clone());
    });
  }

  private ensureContext(): void {
    if (this.context === null) {
      this.context = this.connection.createContext();
    }
  }

  public commit(): Promise<TransactionResults> {
    this.ensureContext();
    let sqls = this.toSql().split(';\n');
    sqls.forEach(sql => this.context.prepare(sql));
    return this.context.commit();
  }

  public rollback(): Promise<void> {
    this.ensureContext();
    return this.context.rollback();
  }

  protected toValueString(value: any, type: ColumnType): string {
    switch (type) {
      case 'number':
        return value.toString();

      case 'date':
        return value.getTime().toString();

      case 'boolean':
        return value ? '1' : '0';

      case 'string':
        return `"${value}"`;

      case 'object':
        if (value instanceof BindableValueHolder) {
          return this.toValueString(value.value, type);
        }
        return `"${JSON.stringify(value)}"`;

      default:
        throw new Error('NotImplemented');
    }
  }
}
