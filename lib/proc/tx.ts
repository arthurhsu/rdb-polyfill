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

import {TableBuilderPolyfill} from '../schema/table_builder_polyfill';
import {TableChangerPolyfill} from '../schema/table_changer_polyfill';
import {TransactionMode} from '../spec/enums';
import {IExecutionContext, TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {ITransaction} from '../spec/transaction';
import {NativeDB} from './native_db';

export class Tx implements ITransaction {
  private db: NativeDB;
  private batchMode: boolean;
  private finalized: boolean;
  private results: TransactionResults;

  public constructor(db: NativeDB, readonly mode: TransactionMode) {
    this.db = db;
    this.finalized = false;
    this.batchMode = null;
  }

  public begin(): Promise<void> {
    // TODO(arthurhsu): find proper implementation
    throw new Error('NotImplemented');
  }

  public exec(queries: IExecutionContext[]): Promise<TransactionResults> {
    if (this.batchMode !== null || this.finalized) {
      throw new Error('TransactionStateError');
    }

    this.batchMode = true;
    let allowDDL = this.db.supportTransactionalSchemaChange();
    let sqls: string[] = ['begin transaction'];
    queries.forEach(q => {
      if (q instanceof Tx) {
        throw new Error('TransactionStateError');
      }

      if (!allowDDL &&
          (q instanceof TableBuilderPolyfill ||
           q instanceof TableChangerPolyfill)) {
        throw new Error('UnsupportedError');
      }

      // TODO(arthurhsu): readonly/readwrite check
      sqls.push(
          (q as (TableBuilderPolyfill|TableChangerPolyfill|IQuery)).toSql());
    });
    sqls.push('commit');
    return this.db.run(sqls);
  }

  public attach(query: IExecutionContext): Promise<TransactionResults> {
    // TODO(arthurhsu): find proper implementation
    throw new Error('NotImplemented');
  }

  public commit(): Promise<TransactionResults> {
    if (this.finalized) {
      return Promise.resolve(this.results);
    }
    // TODO(arthurhsu): find proper implementation
    throw new Error('NotImplemented');
  }

  public rollback(): Promise<void> {
    if (this.finalized || this.batchMode) {
      throw new Error('TransactionStateError');
    }
    // TODO(arthurhsu): clean the object to its initial state
    return Promise.resolve();
  }
}
