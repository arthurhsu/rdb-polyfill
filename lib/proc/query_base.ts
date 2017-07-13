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
import {ColumnType, ValueType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {Sqlite3Connection} from './sqlite3_connection';
import {Sqlite3Context} from './sqlite3_context';
import {Stmt} from './stmt';

export abstract class QueryBase implements IQuery {
  protected connection: Sqlite3Connection;
  protected context: Sqlite3Context;
  protected boundValues: Map<number, any>;
  protected finalized: boolean;

  constructor(connection: Sqlite3Connection) {
    this.connection = connection;
    this.context = null;
    this.finalized = false;
    this.boundValues = new Map<number, any>();
  }

  public attach(context: Sqlite3Context): void {
    this.context = context;
    let sqls = this.prefixSqls().concat(this.toSql());
    sqls.forEach(sql => {
      let needBinding = (sql.indexOf('?') != -1);
      let hasResult = (sql.startsWith('select') || sql.startsWith('explain'));
      let stmt =
          new Stmt(this.connection.getNativeDb(), sql, hasResult, needBinding);
      context.attach(stmt);
    });
    this.preCommit();
  }

  public explain(): Promise<string> {
    throw new Error('NotImplemented');
  }

  public bind(...values: any[]): IQuery {
    for (let i = 0; i < values.length; ++i) {
      this.boundValues.set(i, values[i]);
    }
    return this;
  }

  abstract clone(): IQuery;
  abstract toSql(): string[];

  public prefixSqls(): string[] {
    return [];
  }

  protected cloneBoundValues(source: QueryBase): void {
    source.boundValues.forEach((val, key) => {
      // Not really a deep copy.
      this.boundValues.set(key, val);
    });
  }

  // Additional pre-commit step, e.g. InsertBuilder value binding.
  // The function will be called right after attaching to a context.
  protected preCommit(): void {
  }

  // Additional post-commit step, e.g. SelectBuilder projection list.
  // The function will be called right after commit returns.
  protected postCommit(res: TransactionResults): TransactionResults {
    return res;
  }

  // Generic commit routine, except insert query builder.
  public commit(): Promise<TransactionResults> {
    let implicitContext = false;
    if (this.context === null) {
      implicitContext = true;
      this.attach(this.connection.getImplicitContext());
    }

    return this.context.commit().then(res => {
      if (implicitContext) {
        this.context = null;
      }
      return this.postCommit(res);
    });
  }

  public rollback(): Promise<void> {
    if (this.context === null) {
      return Promise.resolve();
    }
    return this.context.rollback();
  }

  protected toValueString(value: any, type: ColumnType): string {
    switch (type) {
      case 'integer':
        return value.toPrecision(1).toString();

      case 'number':
        return value.toString();

      case 'date':
        return value.getTime().toString();

      case 'boolean':
        return value ? '1' : '0';

      case 'string':
        return value;

      case 'object':
        return JSON.stringify(value);

      case 'blob':
        return BindableValueHolder.binToHex(value as ArrayBuffer);

      default:
        throw new Error('NotImplemented');
    }
  }

  protected toQuotedValueString(value: any, type: ColumnType): string {
    let val = this.toValueString(value, type);
    if (type == 'string' || type == 'object' || type == 'blob') {
      val = `"${val}"`;
    }
    return val;
  }

  protected toValue(value: ValueType, type: string): ValueType {
    switch (type) {
      case 'blob':
        return BindableValueHolder.hexToBin(value as string);

      case 'boolean':
        return value == 1;

      case 'date':
        return new Date(value as number);

      case 'object':
        let res = null;
        try {
          res = JSON.parse(value as string);
        } catch(e) {
          // Do nothing;
        }
        return res;

      default:
        throw new Error('DataError');
    }
  }
}