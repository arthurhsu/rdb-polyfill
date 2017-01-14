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

import {ColumnType} from '../spec/enums';
import {ITable} from '../spec/table';
import {AutoIncrementPrimaryKey, ForeignKeySpec, IndexSpec} from '../spec/table_builder';
import {ColumnSchema} from './column_schema';

export class TableSchema implements ITable {
  readonly _name: string;
  readonly _alias: string;
  public _columns: Map<string, ColumnSchema>;
  public _primaryKey: AutoIncrementPrimaryKey|IndexSpec;
  public _foreignKey: ForeignKeySpec[];
  public _indices: IndexSpec[];
  public _notNull: Set<string>;

  constructor(name: string, alias: string = null) {
    this._name = name;
    this._columns = new Map<string, ColumnSchema>();
    this._primaryKey = null;
    this._foreignKey = [];
    this._indices = [];
    this._notNull = new Set<string>();
  }

  public column(name: string, type: ColumnType, notNull = false) {
    let col = new ColumnSchema(this._alias || this._name, name, type, !notNull);
    this._columns.set(name, col);
    if (notNull) {
      this._notNull.add(name);
    }
    Object.defineProperty(
        this, name,
        {configurable: false, enumerable: false, value: col, writable: false});
  }

  public as(alias: string) {
    let that = new TableSchema(this._name, alias);
    that._columns = new Map<string, ColumnSchema>();
    this._columns.forEach(
        col => new ColumnSchema(
            alias, col.name, col.type, this._notNull.has(col.name)));
    that._primaryKey = this._primaryKey;
    that._foreignKey = this._foreignKey;
    that._indices = this._indices;
    that._notNull = this._notNull;
    return that;
  }

  public isEqual(schema: TableSchema): boolean {
    if (this._name == schema._name) {
      // TODO(arthurhsu): implement
      return true;
    }
    return false;
  }
}
