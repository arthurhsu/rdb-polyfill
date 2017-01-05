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

import {IRelationalDatabase, OpenDatabaseOptions} from '../spec/relational_database';
import {DatabaseConnection} from '../spec/database_connection';
import {FunctionProvider} from './function_provider';
import {SqlConnection} from './sql_connection';

export class SqlDatabase implements IRelationalDatabase {
  readonly fn: FunctionProvider;

  constructor() {
    this.fn = new FunctionProvider();
  }

  public open(name: string, opt?: OpenDatabaseOptions): Promise<DatabaseConnection> {
    // TODO(arthurhsu): implement
    return Promise.resolve(new SqlConnection(name));
  }

  public drop(name: string): Promise<void> {
    return Promise.reject('Not implemented');
  }
}

// Polyfill the navigator.db.
navigator['db'] = new SqlDatabase();
