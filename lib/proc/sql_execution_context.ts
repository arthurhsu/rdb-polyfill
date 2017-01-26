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
import {TableSchema} from '../schema/table_schema';
import {IExecutionContext, TransactionResults} from '../spec/execution_context';
import {SqlConnection} from './sql_connection';

export class SqlExecutionContext implements IExecutionContext {
  private connection: SqlConnection;
  private db: NativeDB;
  private sqls: string[];
  private schemaChange: Map<string, TableSchema>;

  constructor(connection: SqlConnection, implicit = true) {
    this.connection = connection;
    this.db = implicit ? connection.getImplicitContext() : null;
    this.sqls = [];
    this.schemaChange = new Map<string, TableSchema>();
  }

  public prepare(sql: string): void {
    this.sqls.push(sql);
  }

  // Set table to null to report a dropped table.
  public reportSchemaChange(name: string, table: TableSchema): void {
    this.schemaChange.set(name, table);
  }

  public commit(): Promise<TransactionResults> {
    return this.db.run(this.sqls).then((ret: TransactionResults) => {
      this.connection.reportSchemaChange(this.schemaChange);
      return ret;
    });
  }

  public rollback(): Promise<void> {
    return this.db.exec('rollback');
  }

  public inspect(): string[] {
    return this.sqls;
  }
}
