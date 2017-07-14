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

import {Database} from 'sqlite3';
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
  private context: Sqlite3Context;

  public constructor(
      connection: Sqlite3Connection, readonly mode: TransactionMode) {
    // TODO(arthurhsu): honor transaction mode
    this.connection = connection;
    this.finalized = false;
    this.context = null;
  }

  // If there is anything wrong in an in-flight transaction, SQLite3 will be
  // still in that failing transaction. This common error handler will make
  // sure the transaction is rolled back and the connection is out of that
  // faulty transaction.
  private errorHandler<T>(db: Database, resolver: Resolver<T>, e: Error) {
    db.run('rollback;', () => {
      resolver.reject(e);
    });
  }

  private defaultHandler<T>(db: Database, resolver: Resolver<T>, e: Error):
      boolean {
    if (e) {
      this.errorHandler<T>(db, resolver, e);
      return false;
    }
    return true;
  }

  public begin(): Promise<void> {
    if (this.context || this.finalized) {
      throw new Error('TransactionStateError');
    }

    // TODO(arthurhsu): we need connection pooling here, see explanation in
    // exec() function.
    let resolver = new Resolver<void>();
    this.context = new Sqlite3Context(false, this.connection);
    let db = this.connection.getNativeDb();
    db.serialize(() => {
      db.run('begin immediate transaction;', e => {
        if (this.defaultHandler(db, resolver, e)) {
          resolver.resolve();
        }
      });
    });
    return resolver.promise;
  }

  private isQueryBase(query: IExecutionContext): boolean {
    return query && query instanceof QueryBase;
  }

  public exec(queries: IExecutionContext[]): Promise<TransactionResults> {
    if (this.context || this.finalized) {
      throw new Error('TransactionStateError');
    }

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
      this.context.commit().then(
          res => resolver.resolve(res),
          e => this.errorHandler(db, resolver, e));
    });
    return resolver.promise;
  }

  public attach(query: IExecutionContext): Promise<TransactionResults> {
    if (this.context === null || this.finalized) {
      throw new Error('TransactionStateError');
    }

    if (!this.isQueryBase(query)) {
      throw new Error('SyntaxError: not a query');
    }

    (query as QueryBase).attach(this.context);
    let db = this.connection.getNativeDb();
    let resolver = new Resolver<TransactionResults>();
    this.context.consumeAll().then(
        res => resolver.resolve(res),
        e => this.errorHandler(db, resolver, e));
    return resolver.promise;
  }

  public commit(): Promise<TransactionResults> {
    if (this.finalized) {
      return Promise.resolve();
    }

    this.finalized = true;
    if (this.context === null) {
      return Promise.resolve(null);
    }

    return this.context.commit();
  }

  public rollback(): Promise<void> {
    if (this.finalized) {
      throw new Error('TransactionStateError');
    }

    this.finalized = true;
    if (this.context === null) {
      return Promise.resolve(null);
    }

    return this.context.rollback();
  }
}
