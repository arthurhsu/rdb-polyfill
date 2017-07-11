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

import {TransactionMode} from '../spec/enums';
import {IExecutionContext, TransactionResults} from '../spec/execution_context';
import {ITransaction} from '../spec/transaction';
import {Sqlite3Connection} from './sqlite3_connection';

export class Tx implements ITransaction {
  private connection: Sqlite3Connection;
  private finalized: boolean;
  private started: boolean;
  private results: TransactionResults;

  public constructor(
      connection: Sqlite3Connection, readonly mode: TransactionMode) {
    this.connection = connection;
    this.finalized = false;
    this.started = false;
  }

  public begin(): Promise<void> {
    if (this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }
    this.started = true;
    return Promise.resolve();
  }

  public exec(queries: IExecutionContext[]): Promise<TransactionResults> {
    if (this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }

    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public attach(query: IExecutionContext): Promise<TransactionResults> {
    if (!this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }

    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public commit(): Promise<TransactionResults> {
    if (this.finalized) {
      return Promise.resolve(this.results);
    }

    this.finalized = true;
    if (!this.started) {
      return Promise.resolve(null);
    }

    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
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

    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }
}
