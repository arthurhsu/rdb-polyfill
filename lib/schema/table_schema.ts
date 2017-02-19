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
import {AutoIncrementPrimaryKey, ForeignKeySpec, IndexedColumnDefinition} from '../spec/table_builder';
import {ColumnSchema} from './column_schema';

export interface IndexSpec {
  name: string;
  column: IndexedColumnDefinition;
  unique: boolean;
}

export class TableSchema implements ITable {
  private _name: string;
  private _alias: string;
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
    this._alias = alias;
  }

  public getName(): string {
    return this._name;
  }

  public getAlias(): string {
    return this._alias;
  }

  public column(name: string, type: ColumnType, notNull = false) {
    let col = new ColumnSchema(this, name, type, !notNull);
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
    this._columns.forEach(col => {
      let col2 = new ColumnSchema(
          that, col.name, col.type, this._notNull.has(col.name));
      that._columns.set(col.name, col2);
      Object.defineProperty(that, col.name, {
        configurable: false,
        enumerable: false,
        value: col2,
        writable: false
      });
    });

    that._primaryKey = this._primaryKey;
    that._foreignKey = this._foreignKey;
    that._indices = this._indices;
    that._notNull = this._notNull;
    return that;
  }
}
