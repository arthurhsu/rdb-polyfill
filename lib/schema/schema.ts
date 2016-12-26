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

import {IColumn} from '../spec/column';
import {ColumnType} from '../spec/enums';
import {ITable} from '../spec/table';
import {AutoIncrementPrimaryKey, ForeignKeySpec, IndexSpec} from '../spec/table_builder';

export class ColumnSchema implements IColumn {
  constructor(
      readonly name: string, readonly type: ColumnType,
      readonly nullable: boolean, readonly alias: string = null) {}

  public as(alias: string): IColumn {
    return new ColumnSchema(this.name, this.type, this.nullable, alias);
  }
}

export class TableSchema implements ITable {
  readonly name: string;
  readonly alias: string;
  public columns: Map<string, ColumnSchema>;
  public primaryKey: AutoIncrementPrimaryKey|IndexSpec;
  public foreignKey: ForeignKeySpec[];
  public indices: IndexSpec[];
  public notNull: Set<string>;

  constructor(name: string, alias: string = null) {
    this.name = name;
    this.columns = new Map<string, ColumnSchema>();
    this.primaryKey = null;
    this.foreignKey = [];
    this.indices = [];
    this.notNull = new Set<string>();
  }

  public column(name: string, type: ColumnType, notNull = false) {
    let col = new ColumnSchema(name, type, !notNull);
    this.columns.set(name, col);
    if (notNull) {
      this.notNull.add(name);
    }
  }

  public as(alias: string) {
    let that = new TableSchema(this.name, alias);
    that.columns = this.columns;
    that.primaryKey = this.primaryKey;
    that.foreignKey = this.foreignKey;
    that.indices = this.indices;
    that.notNull = this.notNull;
    return that;
  }
}

export class Schema {
  readonly name: string;
  readonly version: number;
  public tables: Map<string, TableSchema>;

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
    this.tables = new Map<string, TableSchema>();
  }
}
