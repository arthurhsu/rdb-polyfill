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

import {ColumnType, ForeignKeyAction, ForeignKeyTiming, IndexType, Order} from './enums';
import {IExecutionContext} from './execution_context';

export interface AutoIncrementPrimaryKey {
  name: string;
  autoIncrement: boolean;
}

export type PrimaryKeyDefinition =
    IndexedColumnDefinition | AutoIncrementPrimaryKey;

export interface ForeignKeySpec {
  name: string;
  local: string;
  remote: string;
  action: ForeignKeyAction;
  timing: ForeignKeyTiming;
}

export interface IndexedColumnSpec {
  name: string;
  order: Order;
}
export type IndexedColumnDefinition =
    string | string[] | IndexedColumnSpec | IndexedColumnSpec[];

export interface IndexSpec {
  name: string;
  column: IndexedColumnDefinition;
  type?: IndexType;
  unique?: boolean;
}

export interface ITableBuilder extends IExecutionContext {
  column(name: string, type: ColumnType, notNull?: boolean): ITableBuilder;
  primaryKey(primaryKey: PrimaryKeyDefinition): ITableBuilder;
  foreignKey(foreignKey: ForeignKeySpec): ITableBuilder;
  index(index: IndexSpec): ITableBuilder;
}
