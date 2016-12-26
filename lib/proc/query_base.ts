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

import {ColumnType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {SQLDB} from './sql_db';

export abstract class QueryBase implements IQuery {
  protected db: SQLDB;
  constructor(db: SQLDB) {
    this.db = db;
  }

  public explain(): Promise<string> {
    return Promise.resolve('Explain not implemented');
  }

  public bind(...values: any[]): IQuery {
    throw new Error('Not implemented');
  }

  abstract clone(): IQuery;
  abstract toSql(): string;

  public commit(): Promise<TransactionResults> {
    // TODO(arthurhsu): handle multiple sql situation, e.g. insert() values.
    return this.db.execSQL(this.toSql());
  }

  public rollback(): Promise<void> {
    return this.db.rollback();
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
        return `"${JSON.stringify(value)}"`;

      default:
        throw new Error('NotImplemented');
    }
  }
}
