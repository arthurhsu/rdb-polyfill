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

import {IBindableValue} from './bindable_value';
import {IColumn} from './column';
import {IDataQueryProvider} from './data_query_provider';
import {IDatabaseObserver, ObserverCallback} from './database_observer';
import {IDatabaseSchema} from './database_schema';
import {IDeleteQuery} from './delete_query';
import {TransactionMode} from './enums';
import {IExecutionContext} from './execution_context';
import {IInsertQuery} from './insert_query';
import {ISchemaQueryProvider} from './schema_query_provider';
import {ISelectQuery} from './select_query';
import {ITable} from './table';
import {ITableBuilder} from './table_builder';
import {ITableChanger} from './table_changer';
import {ITransaction} from './transaction';
import {IUpdateQuery} from './update_query';

export interface IDatabaseConnection {
  createTransaction(mode?: TransactionMode): ITransaction;
  close(): Promise<void>;
  bind(index: number): IBindableValue;
}

export abstract class DatabaseConnection implements IDatabaseConnection,
                                                    IDatabaseObserver,
                                                    IDataQueryProvider,
                                                    ISchemaQueryProvider {
  readonly name: string;

  public abstract createTransaction(mode?: TransactionMode): ITransaction;
  public abstract close(): Promise<void>;
  public abstract bind(index: number): IBindableValue;

  public abstract select(...columns: IColumn[]): ISelectQuery;
  public abstract insert(): IInsertQuery;
  public abstract insertOrReplace(): IInsertQuery;
  public abstract update(table: ITable): IUpdateQuery;
  public abstract delete(): IDeleteQuery;

  public abstract setVersion(version: number): IExecutionContext;
  public abstract setForeignKeyCheck(value: boolean): IExecutionContext;
  public abstract schema(): IDatabaseSchema;
  public abstract createTable(name: string): ITableBuilder;
  public abstract alterTable(): ITableChanger;
  public abstract dropTable(name: string): IExecutionContext;

  public abstract observe(query: ISelectQuery, callbackFn: ObserverCallback):
      string;
  public abstract unobserve(observerKey: string): void;
}
