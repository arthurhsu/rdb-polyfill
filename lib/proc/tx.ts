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

import {Resolver} from '../base/resolver';
import {TransactionMode} from '../spec/enums';
import {IExecutionContext, TransactionResults} from '../spec/execution_context';
import {ITransaction} from '../spec/transaction';
import {QueryBase} from './query_base';
import {Sqlite3Connection} from './sqlite3_connection';
import {Sqlite3Context} from './sqlite3_context';
import {Stmt} from './stmt';

export class Tx implements ITransaction {
  private connection: Sqlite3Connection;
  private finalized: boolean;
  private started: boolean;
  private results: TransactionResults;
  private context: Sqlite3Context;

  public constructor(
      connection: Sqlite3Connection, readonly mode: TransactionMode) {
    // TODO(arthurhsu): honor transaction mode
    this.connection = connection;
    this.finalized = false;
    this.started = false;
    this.context = null;
  }

  public begin(): Promise<void> {
    if (this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }
    this.started = true;
    return Promise.resolve();
  }

  private isQueryBase(query: IExecutionContext): boolean {
    return query && query instanceof QueryBase;
  }

  public exec(queries: IExecutionContext[]): Promise<TransactionResults> {
    if (this.started || this.finalized) {
      throw new Error('TransactionStateError');
    }

    this.started = true;
    this.finalized = true;

    // TODO(arthurhsu): we need connection pooling here. A connection
    // can have only one in-flight transaction, otherwise it will throw
    // TRANSACTION IN TRANSACTION error.
    // Connection pooling is currently not possible for in-memory database
    // since node-sqlite3 does not support shared cache.
    this.context = new Sqlite3Context(true, this.connection);
    let db = this.connection.getNativeDb();
    let resolver = new Resolver<TransactionResults>();
    db.serialize(() => {
      this.context.attach(new Stmt(db, 'begin transaction;', false, false));

      if (!queries.every(q => this.isQueryBase(q))) {
        throw new Error('SyntaxError');
      }

      queries.forEach(q => (q as QueryBase).attach(this.context));
      this.context.attach(new Stmt(db, 'commit;', false, false));
      this.context.commit().then(res => {
        resolver.resolve(res);
      }, e => {
        // SQLite3 is still in the failing transaction, need to rollback.
        db.run('rollback;', () => {
          resolver.reject(e);
        });
      });
    });
    return resolver.promise;
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
