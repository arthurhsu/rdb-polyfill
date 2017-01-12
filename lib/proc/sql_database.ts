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
import {sqlite3} from '../dep/sqlite';
import {DatabaseConnection} from '../spec/database_connection';
import {IRelationalDatabase, OpenDatabaseOptions} from '../spec/relational_database';
import {FunctionProvider} from './function_provider';
import {SqlConnection} from './sql_connection';

export class SqlDatabase implements IRelationalDatabase {
  readonly fn: FunctionProvider;
  private dbName: string;
  private dbVersion: number;
  private db: Database;

  constructor(readonly persistPath: string) {
    this.fn = new FunctionProvider();
  }

  public open(name: string, opt?: OpenDatabaseOptions):
      Promise<DatabaseConnection> {
    let resolver = new Resolver<DatabaseConnection>();

    this.dbName = (opt && opt.storageType == 'temporary') ? ':memory:' : name;
    this.db = new sqlite3.Database(`${this.persistPath}/${this.dbName}`);
    this.db.get('pragma schema_version', [], (err: any, row: any) => {
      this.dbVersion = row['schema_version'] as number;
      resolver.resolve(new SqlConnection(name, this.dbVersion, this.db));
    });

    return resolver.promise;
  }

  public drop(name: string): Promise<void> {
    return Promise.reject('Not implemented');
  }

  public clone(): Database {
    return new sqlite3.Database(this.dbName);
  }
}
