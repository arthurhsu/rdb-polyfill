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

import {ColumnType, ValueType} from './enums';
import {IExecutionContext} from './execution_context';
import {ForeignKeySpec, IndexSpec, PrimaryKeyDefinition} from './table_builder';

export interface ITableChanger extends IExecutionContext {
  rename(newTableName: string): ITableChanger;
  addColumn(
      name: string, type: ColumnType, notNull?: boolean,
      defaultValue?: ValueType): ITableChanger;
  dropColumn(name: string): ITableChanger;
  addPrimaryKey(primaryKey: PrimaryKeyDefinition): ITableChanger;
  dropPrimaryKey(): ITableChanger;
  addForeignKey(foreignKey: ForeignKeySpec): ITableChanger;
  addIndex(index: IndexSpec): ITableChanger;
  dropConstraintOrIndex(name: string): ITableChanger;
  setColumn(name: string): IColumnChanger;
}

export interface IColumnChanger {
  set(newColumnName: string, notNull?: boolean): ITableChanger;
}
