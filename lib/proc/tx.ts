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
  private finalized: boolean;
  private started: boolean;
  private results: TransactionResults;
  private allowDDL: boolean;

  public constructor(db: NativeDB, readonly mode: TransactionMode) {
    this.db = db;
    this.finalized = false;
    this.started = false;
    this.allowDDL = this.db.supportTransactionalSchemaChange();
  }

  public begin(): Promise<void> {
    if (this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }
    this.started = true;
    return this.db.exec('begin transaction');
  }

  private checkDDL(q: IExecutionContext): void {
    if (!this.allowDDL && (q instanceof TableBuilderPolyfill ||
                           q instanceof TableChangerPolyfill)) {
      throw new Error('UnsupportedError');
    }
  }

  private getSql(q: IExecutionContext): string {
    return (q as (TableBuilderPolyfill | TableChangerPolyfill | IQuery))
        .toSql();
  }

  public exec(queries: IExecutionContext[]): Promise<TransactionResults> {
    if (this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }

    this.started = true;
    this.finalized = true;
    let sqls: string[] = [];
    queries.forEach(q => {
      if (q instanceof Tx) {
        throw new Error('TransactionStateError');
      }

      this.checkDDL(q);

      // TODO(arthurhsu): readonly/readwrite check
      sqls.push(this.getSql(q));
    });

    // db#run() already offered transactional support.
    return this.db.run(sqls).then(results => {
      this.results = results;
      return results;
    });
  }

  public attach(query: IExecutionContext): Promise<TransactionResults> {
    this.checkDDL(query);

    let sql = this.getSql(query);
    if (sql.startsWith('select')) {
      return this.db.get(sql).then(results => {
        this.results = results;
      });
    }
    return this.db.exec(sql);
  }

  public commit(): Promise<TransactionResults> {
    if (this.finalized) {
      return Promise.resolve(this.results);
    }

    this.finalized = true;
    if (!this.started) {
      return Promise.resolve(null);
    }

    return this.db.exec('commit').then(() => {
      return this.results;
    });
  }

  public rollback(): Promise<void> {
    if (this.finalized) {
      throw new Error('TransactionStateError');
    }

    this.finalized = true;
    this.results = undefined;
    if (!this.started) {
      return Promise.resolve(null);
    }

    return this.db.exec('rollback');
  }
}
