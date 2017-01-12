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
import {DBResponse, NativeDB} from '../dep/sqlite';
import {Schema} from '../schema/schema';
import {DatabaseConnection} from '../spec/database_connection';
import {IRelationalDatabase, OpenDatabaseOptions} from '../spec/relational_database';
import {FunctionProvider} from './function_provider';
import {SqlConnection} from './sql_connection';

export class SqlDatabase implements IRelationalDatabase {
  readonly fn: FunctionProvider;
  private givenName: string;
  private dbName: string;
  private dbVersion: number;
  private db: NativeDB;
  private dbOptions: OpenDatabaseOptions;

  constructor(readonly persistPath: string) {
    this.fn = new FunctionProvider();
  }

  public open(name: string, opt?: OpenDatabaseOptions):
      Promise<DatabaseConnection> {
    this.dbOptions = opt;
    this.givenName = name;
    return this.reopen();
  }

  public drop(name: string): Promise<void> {
    return Promise.reject('Not implemented');
  }

  public clone(): SqlDatabase {
    let that = new SqlDatabase(this.persistPath);
    that.dbOptions = this.dbOptions;
    that.givenName = this.givenName;
    return that;
  }

  public reopen(): Promise<SqlConnection> {
    if (!this.givenName || this.db) {
      throw new Error('Invalid reopen request');
    }

    let volatile =
        (this.dbOptions && this.dbOptions.storageType == 'temporary');
    this.dbName =
        volatile ? ':memory:' : `${this.persistPath}/${this.givenName}`;

    let resolver = new Resolver<SqlConnection>();
    this.db = new NativeDB(this.dbName);
    this.db.get('pragma schema_version').then((result: DBResponse) => {
      this.dbVersion = result.row['schema_version'] as number;
      return this.constructSchema();
    }).then((schema: Schema) => {
      resolver.resolve(
          new SqlConnection(this.givenName, this.dbVersion, this.db, schema));
    });
    return resolver.promise;
  }

  private constructSchema(): Promise<Schema> {
    let resolver = new Resolver<Schema>();
    let schema = new Schema(this.givenName, this.dbVersion);
    if (this.givenName == this.dbName && this.dbVersion > 0) {
      // TODO(arthurhsu): construct schema
    } else {
      // Volatile or new database
      resolver.resolve(schema);
    }
    return resolver.promise;
  }
}
