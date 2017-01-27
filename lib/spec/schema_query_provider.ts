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

import {IDatabaseSchema} from './database_schema';
import {IExecutionContext} from './execution_context';
import {ITableBuilder} from './table_builder';
import {ITableChanger} from './table_changer';

export interface ISchemaQueryProvider {
  readonly supportTransactionalSchemaChange: boolean;
  setVersion(version: number): IExecutionContext;
  setForeignKeyCheck(value: boolean): IExecutionContext;
  schema(): IDatabaseSchema;
  createTable(name: string): ITableBuilder;
  alterTable(name: string): ITableChanger;
  dropTable(name: string): IExecutionContext;
}
