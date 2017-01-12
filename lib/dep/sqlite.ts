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

/* tslint:disable */
let sqlite3NodeWrapper = require('sqlite3');
/* tslint:enable */

export const sqlite3 = sqlite3NodeWrapper.verbose();

export type DBResponse = {err: any, row?: any};

// Promise-based wrapper of sqlite3 APIs.
// Each instance wraps one connection to the database.
export class NativeDB {
  private db: Database;
  private path: string;

  constructor(path: string) {
    this.path = path;
    this.db = new sqlite3.Database(path);
  }

  public get(stmt: string): Promise<DBResponse> {
    let resolver = new Resolver<DBResponse>();
    this.db.get(stmt, [], (err: any, row: any) => {
      resolver.resolve({err: err, row: row} as DBResponse);
    });
    return resolver.promise;
  }

  public close(): Promise<DBResponse> {
    let resolver = new Resolver<DBResponse>();
    this.db.close(err => {
      resolver.resolve({err: err} as DBResponse);
    });
    return resolver.promise;
  }
}
