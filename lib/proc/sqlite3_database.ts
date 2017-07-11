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

import {DatabaseConnection} from '../spec/database_connection';
import {IDatabaseFunctionProvider} from '../spec/database_function_provider';
import {IRelationalDatabase, OpenDatabaseOptions, RDBStorageType} from '../spec/relational_database';
import {FunctionProvider} from './function_provider';
import {Sqlite3Connection} from './sqlite3_connection';

export class Sqlite3Database implements IRelationalDatabase {
  readonly fn: IDatabaseFunctionProvider;
  private map: Map<string, Object>;

  constructor() {
    this.fn = new FunctionProvider();
    this.map = new Map<string, Object>();
  }

  public open(name: string, opt?: OpenDatabaseOptions):
      Promise<DatabaseConnection> {
    if (this.map.has(name)) {
      return Promise.resolve(this.map.get(name)['connection']);
    }

    if (!opt || opt.storageType == 'temporary') {
      opt = {storageType: 'temporary' as RDBStorageType, filePath: ':memory:'};
    } else if (opt.storageType == 'persistent') {
      if (!opt.filePath || opt.filePath.trim().length == 0) {
        throw new Error('FIXME: wrong file path');
      }
    }
    let connection = new Sqlite3Connection(name, opt.filePath, false);
    this.map.set(name, {connection: connection, path: opt.filePath});
    return this.initConnection(connection);
  }

  public drop(name: string): Promise<void> {
    if (this.map.has(name)) {
      let val = this.map.get(name);
      return val['connection'].close().then(() => {
        /* tslint:disable */
        const fs = require('fs-extra');
        /* tslint:enable */
        fs.unlinkSync(val['path']);
      });
    }
    return Promise.resolve();
  }

  private initConnection(connection: Sqlite3Connection):
      Promise<DatabaseConnection> {
    // Enable foreign key check
    return connection.simpleRun(['pragma foreign_keys=on;']).then(() => {
      return connection.init();
    });
  }
}