/**
 * @license
 * Copyright 2016 The Lovefield Project Authors. All Rights Reserved.
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

import {NativeDB} from '../dep/sqlite';
import {IExecutionContext, TransactionResults} from '../spec/execution_context';

export class SqlExecutionContext implements IExecutionContext {
  private db: NativeDB;
  private sqls: string[];

  constructor(db: NativeDB) {
    this.db = db;
    this.sqls = [];
  }

  public prepare(sql: string) {
    this.sqls.push(sql);
  }

  public commit(): Promise<TransactionResults> {
    return this.db.run(this.sqls);
  }

  public rollback(): Promise<void> {
    return this.db.exec('rollback');
  }

  public inspect(): string[] {
    return this.sqls;
  }
}
