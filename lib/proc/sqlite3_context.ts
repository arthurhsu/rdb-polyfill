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

import {Sqlite3Connection} from './sqlite3_connection';
import {Stmt} from './stmt';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {IExecutionContext, TransactionResults} from '../spec/execution_context';

export class Sqlite3Context implements IExecutionContext {
  private stmts: Stmt[];
  private finalized: boolean;
  private schemaMap: Map<string, TableSchema>;
  private revertSchemaMap: Map<string, TableSchema>;

  constructor(readonly batchMode: boolean,
              readonly connection: Sqlite3Connection) {
    this.stmts = [];
    this.finalized = false;
    this.schemaMap = new Map<string, TableSchema>();
    this.revertSchemaMap = new Map<string, TableSchema>();
  }

  private checkState(): void {
    if (this.finalized) {
      throw new Error('TransactionState');
    }
  }

  public attach(stmt: Stmt): void {
    this.checkState();
    if (stmt.sql.startsWith('alter table') ||
        stmt.sql.startsWith('drop table')) {
      throw new Error(
          'NotSupported: SQLite does not support rollback alter/drop table');
    }
    this.stmts.push(stmt);
  }

  // Execute all stmts in queue and empty the queue.
  public consumeAll(): Promise<TransactionResults> {
    let results: TransactionResults = undefined;
    let runner = (): Promise<TransactionResults> => {
      if (this.stmts.length <= 0) {
        return Promise.resolve(results);
      }

      let stmt = this.stmts.shift();
      return stmt.hasResults ?
          stmt.all().then(res => {
            results = res;
            return runner();
          }) :
          stmt.run().then(() => {
            return runner();
          });
    };
    return runner().then(res => {
      let schema: Schema = this.connection.schema() as Schema;
      this.schemaMap.forEach((tableSchema, name) => {
        if (!this.revertSchemaMap.has(name)) {
          this.revertSchemaMap.set(name, schema.tableSchema(name) || null);
        }
        schema.reportTableChange(name, tableSchema);
      });
      return res;
    });
  }

  public bind(args: any|any[]): void {
    this.stmts.forEach(stmt => {
      if (stmt.needBinding) {
        stmt.bind(args);
      }
    });
  }

  public reportTableChange(name: string, schema: TableSchema) {
    this.schemaMap.set(name, schema);
  }

  public commit(): Promise<TransactionResults> {
    this.checkState();
    this.finalized = true;

    if (!this.batchMode) {
      return this.connection.simpleRun(['commit;']);
    }

    return this.consumeAll();
  }

  public rollback(): Promise<void> {
    this.checkState();
    this.finalized = true;

    if (!this.batchMode) {
      let schema: Schema = this.connection.schema() as Schema;
      this.revertSchemaMap.forEach((tableSchema, name) => {
        schema.reportTableChange(name, tableSchema);
      });
      return this.connection.simpleRun(['rollback;']);
    }

    return Promise.resolve();
  }
}