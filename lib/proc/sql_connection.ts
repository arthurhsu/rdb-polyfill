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

export class SqlConnection extends DatabaseConnection {
  constructor(readonly name: string) {
    super();
  }

  public createTransaction(mode?: TransactionMode): ITransaction {
    throw new Error('NotImplemented');
  }

  public close(): Promise<void>  {
    throw new Error('NotImplemented');
  }

  public bind(index: number): IBindableValue  {
    return new BindableValueHolder(index);
  }

  public select(...columns: IColumn[]): ISelectQuery  {
    throw new Error('NotImplemented');
  }

  public insert(): IInsertQuery  {
    throw new Error('NotImplemented');
  }

  public insertOrReplace(): IInsertQuery  {
    throw new Error('NotImplemented');
  }

  public update(table: ITable): IUpdateQuery  {
    throw new Error('NotImplemented');
  }

  public delete(): IDeleteQuery  {
    throw new Error('NotImplemented');
  }

  public setVersion(version: number): IExecutionContext {
    throw new Error('NotImplemented');
  }

  public setForeignKeyCheck(value: boolean): IExecutionContext {
    throw new Error('NotImplemented');
  }

  public schema(): IDatabaseSchema {
    throw new Error('NotImplemented');
  }

  public createTable(name: string): ITableBuilder {
    throw new Error('NotImplemented');
  }

  public alterTable(): ITableChanger {
    throw new Error('NotImplemented');
  }

  public dropTable(name: string): IExecutionContext {
    throw new Error('NotImplemented');
  }

  public observe(query: ISelectQuery, callbackFn: ObserverCallback): string {
    throw new Error('NotImplemented');
  }

  public unobserve(observerKey: string): void {
    throw new Error('NotImplemented');
  }
}
