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

import {NativeDB} from '../dep/sqlite';
import {BindableValueHolder} from '../schema/bindable_value_holder';
import {Schema} from '../schema/schema';
import {TableBuilderPolyfill} from '../schema/table_builder_polyfill';
import {TableChangerPolyfill} from '../schema/table_changer_polyfill';
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
import {SelectQueryBuilder} from './select_query_builder';
import {SqlExecutionContext} from './sql_execution_context';
import {UpdateQueryBuilder} from './update_query_builder';

export class SqlConnection extends DatabaseConnection {
  private dbSchema: Schema;
  private db: NativeDB;

  constructor(
      readonly name: string, public version: number, db: NativeDB,
      schema: Schema) {
    super();
    this.db = db;
    this.dbSchema = schema;
  }

  public createTransaction(mode?: TransactionMode): ITransaction {
    throw new Error('NotImplemented');
  }

  public close(): Promise<void> {
    throw new Error('NotImplemented');
  }

  public bind(index: number): IBindableValue {
    return new BindableValueHolder(index);
  }

  public select(...columns: IColumn[]): ISelectQuery {
    return new SelectQueryBuilder(this.createContext(), this.dbSchema, columns);
  }

  public insert(): IInsertQuery {
    return new InsertQueryBuilder(this.createContext(), this.dbSchema);
  }

  public insertOrReplace(): IInsertQuery {
    return new InsertQueryBuilder(this.createContext(), this.dbSchema, true);
  }

  public update(table: ITable): IUpdateQuery {
    return new UpdateQueryBuilder(this.createContext(), this.dbSchema, table);
  }

  public delete(): IDeleteQuery {
    return new DeleteQueryBuilder(this.createContext(), this.dbSchema);
  }

  public setVersion(version: number): IExecutionContext {
    throw new Error('NotImplemented');
  }

  public setForeignKeyCheck(value: boolean): IExecutionContext {
    throw new Error('NotImplemented');
  }

  public schema(): IDatabaseSchema {
    return this.dbSchema;
  }

  public createTable(name: string): ITableBuilder {
    return new TableBuilderPolyfill(this.createContext(), name);
  }

  public alterTable(name: string): ITableChanger {
    return new TableChangerPolyfill(this.createContext(), name);
  }

  public dropTable(name: string): IExecutionContext {
    let context = this.createContext();
    context.prepare(`drop table ${name}`);
    return context;
  }

  public observe(query: ISelectQuery, callbackFn: ObserverCallback): string {
    throw new Error('NotImplemented');
  }

  public unobserve(observerKey: string): void {
    throw new Error('NotImplemented');
  }

  private createContext(): SqlExecutionContext {
    return new SqlExecutionContext(this);
  }
}
