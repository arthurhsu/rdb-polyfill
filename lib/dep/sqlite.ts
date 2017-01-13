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
import {TransactionResults} from '../spec/execution_context';

/* tslint:disable */
let sqlite3NodeWrapper = require('sqlite3');
/* tslint:enable */

export const sqlite3 = sqlite3NodeWrapper.verbose();

// Promise-based wrapper of sqlite3 APIs.
// Each instance wraps one connection to the database.
export class NativeDB {
  private db: Database;
  private path: string;

  constructor(path: string) {
    this.path = path;
    this.db = new sqlite3.Database(path);
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
    let resolver = new Resolver<TransactionResults>();
    this.db.all(sql, [], (err: Error, rows: any[]) => {
      if (err) {
        resolver.reject(err);
      } else {
        resolver.resolve(rows.length ? rows as Object[] : undefined);
      }
    });
    return resolver.promise;
  }

  // Sequentially run the SQL statements given. All results will be
  // concatenated into one single response, and only last error stays.
  public run(sqls: string[]): Promise<TransactionResults> {
    let resolver = new Resolver<TransactionResults>();

    let index = 0;
    let result: Object[] = [];

    let runner = () => {
      if (index == sqls.length) {
        resolver.resolve(result);
        return;
      }
      let sql = sqls[index];
      this.get(sql).then(res => {
        if (res) {
          Array.prototype.push.apply(result, res);
        }
        index++;
        runner();
      }, resolver.reject);
    };

    runner();
    return resolver.promise;
  }

  // Parallelly run SQL statements and don't really care their return values.
  // Anything failed will result in rejection. This can result in
  // partial-update. Caller is responsible for ensuring transaction.
  public parallel(sqls: string[]): Promise<void> {
    let promises = new Array<Promise<void>>(sqls.length);
    sqls.forEach((sql, index) => {
      this.db.run(sql, (err: Error) => {
        promises[index] = err ? Promise.reject(err) : Promise.resolve();
      });
    });
    return Promise.all(promises).then(() => {
      return Promise.resolve();
    }, (e) => {
      return Promise.reject(e);
    });
  }

  public exec(sql: string): Promise<void> {
    let resolver = new Resolver<void>();
    this.db.exec(sql, err => {
      if (err) {
        resolver.reject(err);
      } else {
        resolver.resolve();
      }
    });
    return resolver.promise;
  }
}
