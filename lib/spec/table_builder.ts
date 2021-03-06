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

import {ColumnType, ForeignKeyAction, ForeignKeyTiming, Order} from './enums';
import {IExecutionContext} from './execution_context';

export interface IndexedColumnSpec {
  name: string;
  order: Order;
}

export type IndexedColumnDefinition =
    string | string[] | IndexedColumnSpec | IndexedColumnSpec[];

export interface ITableBuilder extends IExecutionContext {
  column(name: string, type: ColumnType, notNull?: boolean): ITableBuilder;
  primaryKey(columns: string|string[], autoIncrement?: boolean): ITableBuilder;
  foreignKey(name: string, column: string|string[], foreign: string|string[],
      action?: ForeignKeyAction, timing?: ForeignKeyTiming): ITableBuilder;
  index(name: string, columns: IndexedColumnDefinition, unique?: boolean): ITableBuilder;
}
