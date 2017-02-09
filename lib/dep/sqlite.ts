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
import {NativeDB} from '../proc/native_db';
import {TransactionResults} from '../spec/execution_context';

/* tslint:disable */
let sqlite3NodeWrapper = require('sqlite3');
/* tslint:enable */

export const sqlite3 = sqlite3NodeWrapper.verbose();

// Promise-based wrapper of sqlite3 APIs.
// Each instance wraps one connection to the database.
export class Sqlite3DB implements NativeDB {
  private db: Database;
  private path: string;

  constructor(path: string) {
    this.path = path;
    this.db = new sqlite3.Database(path || '.');
  }

  public close(): Promise<Error> {
    let resolver = new Resolver<Error>();
    this.db.close(err => resolver.resolve(err));
    return resolver.promise;
  }

  public get(sql: string): Promise<TransactionResults> {
    // There are many different flavors of Database execution, and we only use
    // Database#all in our code, because it returns all rows. This can/should
    // be further optimized.
    // TODO(arthurhsu): optimize it
    let resolver = new Resolver<TransactionResults>();
    this.db.all(sql, [], (err: Error, rows: any[]) => {
      if (err) {
        console.error('ERROR:', sql, err.message);
        resolver.reject(err);
      } else {
        resolver.resolve(rows.length ? rows as Object[] : undefined);
      }
    });
    return resolver.promise;
  }

  // Sequentially run the SQL statements given. All results will be
  // concatenated into one single response. All statement are run in a single
  // transaction.
  public run(origSqls: string[]): Promise<TransactionResults> {
    let resolver = new Resolver<TransactionResults>();

    let sqls = ['begin transaction'].concat(origSqls);
    sqls.push('commit');
    let index = 0;
    let result: Object[] = [];

    let runner = () => {
      if (index == sqls.length) {
        resolver.resolve(result);
        return;
      }
      let sql = sqls[index];
      let promise = sql.startsWith('select') ? this.get(sql) : this.exec(sql);
      promise.then(res => {
        if (res) {
          Array.prototype.push.apply(result, res);
        }
        index++;
        runner();
      }, (e) => resolver.reject(e));
    };

    runner();
    return resolver.promise;
  }

  public exec(sql: string): Promise<void> {
    let resolver = new Resolver<void>();
    // TODO(arthurhsu): investigate when multiple statements are exec()
    // at the same time
    this.db.exec(sql, err => {
      if (err) {
        console.error('ERROR:', sql, err.message);
        resolver.reject(err);
      } else {
        resolver.resolve();
      }
    });
    return resolver.promise;
  }

  public supportTransactionalSchemaChange(): boolean {
    return true;
  }
}
