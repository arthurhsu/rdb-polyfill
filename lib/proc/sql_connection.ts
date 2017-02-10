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

import {BindableValueHolder} from '../schema/bindable_value_holder';
import {Schema} from '../schema/schema';
import {TableBuilderPolyfill} from '../schema/table_builder_polyfill';
import {TableChangerPolyfill} from '../schema/table_changer_polyfill';
import {TableSchema} from '../schema/table_schema';
import {IBindableValue} from '../spec/bindable_value';
import {IColumn} from '../spec/column';
import {DatabaseConnection} from '../spec/database_connection';
import {ObserverCallback} from '../spec/database_observer';
import {IDatabaseSchema} from '../spec/database_schema';
import {IDeleteQuery} from '../spec/delete_query';
import {TransactionMode} from '../spec/enums';
import {IExecutionContext} from '../spec/execution_context';
import {IInsertQuery} from '../spec/insert_query';
import {ISelectQuery} from '../spec/select_query';
import {ITable} from '../spec/table';
import {ITableBuilder} from '../spec/table_builder';
import {ITableChanger} from '../spec/table_changer';
import {ITransaction} from '../spec/transaction';
import {IUpdateQuery} from '../spec/update_query';
import {DeleteQueryBuilder} from './delete_query_builder';
import {InsertQueryBuilder} from './insert_query_builder';
import {NativeDB} from './native_db';
import {SelectQueryBuilder} from './select_query_builder';
import {SingleQuery} from './single_query';
import {SqlExecutionContext} from './sql_execution_context';
import {Tx} from './tx';
import {UpdateQueryBuilder} from './update_query_builder';

export class SqlConnection extends DatabaseConnection {
  private dbSchema: Schema;
  private db: NativeDB;

  constructor(db: NativeDB, schema: Schema) {
    super();
    this.db = db;
    this.dbSchema = schema;
  }

  public get name(): string {
    return this.dbSchema.name;
  }

  public get version(): number {
    return this.dbSchema.version;
  }

  public get supportTransactionalSchemaChange(): boolean {
    return this.db.supportTransactionalSchemaChange();
  }

  public createTransaction(mode = 'readonly' as TransactionMode): ITransaction {
    return new Tx(this.db, mode);
  }

  public close(): Promise<Error> {
    return this.db.close();
  }

  public bind(index: number): IBindableValue {
    return new BindableValueHolder(index);
  }

  public select(...columns: IColumn[]): ISelectQuery {
    return new SelectQueryBuilder(this, this.dbSchema, columns);
  }

  public insert(): IInsertQuery {
    return new InsertQueryBuilder(this, this.dbSchema);
  }

  public insertOrReplace(): IInsertQuery {
    return new InsertQueryBuilder(this, this.dbSchema, true);
  }

  public update(table: ITable): IUpdateQuery {
    return new UpdateQueryBuilder(this, this.dbSchema, table);
  }

  public delete(): IDeleteQuery {
    return new DeleteQueryBuilder(this, this.dbSchema);
  }

  public setVersion(version: number): IExecutionContext {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public setForeignKeyCheck(value: boolean): IExecutionContext {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public schema(): IDatabaseSchema {
    return this.dbSchema;
  }

  public createTable(name: string): ITableBuilder {
    return new TableBuilderPolyfill(this, name, this.dbSchema.name);
  }

  public alterTable(name: string): ITableChanger {
    return new TableChangerPolyfill(this, name, this.dbSchema.name);
  }

  public dropTable(name: string): IExecutionContext {
    return new SingleQuery(this, `drop table ${name}`, true);
  }

  public observe(query: ISelectQuery, callbackFn: ObserverCallback): string {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public unobserve(observerKey: string): void {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public getImplicitContext(): NativeDB {
    return this.db;
  }

  public reportSchemaChange(change: Map<string, TableSchema>): void {
    this.dbSchema.reportChange(change);
  }

  public createContext(): SqlExecutionContext {
    return new SqlExecutionContext(this, true);
  }
}
