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

import {SQLDB} from '../proc/sql_db';
import {ColumnType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {ForeignKeySpec, IndexSpec, ITableBuilder, PrimaryKeyDefinition} from '../spec/table_builder';
import {TableSchema} from './schema';

export class TableBuilderPolyfill implements ITableBuilder {
  private db: SQLDB;
  private name: string;
  private columnSql: string[];
  private constraintSql: string[];
  private columnType: Map<string, ColumnType>;
  private schema: TableSchema;

  constructor(db: SQLDB, name: string) {
    this.db = db;
    this.name = name;
    this.columnSql = [];
    this.constraintSql = [];
    this.columnType = new Map<string, ColumnType>();

    this.schema = new TableSchema(name);
  }

  public column(name: string, type: ColumnType, notNull = false):
      ITableBuilder {
    if (this.columnType.has(name)) {
      throw new Error('SyntaxError');
    }
    let sqlType = this.getType(type);
    let postfix = notNull ? ' not null' : '';
    this.columnType.set(name, type);
    this.columnSql.push(`${name} ${sqlType}${postfix}`);
    this.schema.column(name, type, notNull);
    return this;
  }

  private getType(type: ColumnType): string {
    switch (type) {
      case 'blob':
        return 'blob';

      case 'number':
      case 'date':
        return 'real';

      case 'boolean':
        return 'integer';

      case 'string':
      case 'object':
        return 'text';

      default:
        throw new Error('InvalidSchemaError');
    }
  }

  public primaryKey(primaryKey: PrimaryKeyDefinition): ITableBuilder {
    if (typeof primaryKey != 'string') {
      throw new Error('NotImplementedYet');
    }

    let type = this.columnType.get(primaryKey as string);
    if (type == 'blob' || type == 'object') {
      throw new Error('InvalidSchemaError');
    }

    this.constraintSql.push(`primary key (${primaryKey})`);
    return this;
  }

  public foreignKey(foreignKey: ForeignKeySpec): ITableBuilder {
    return this;
  }

  public index(index: IndexSpec): ITableBuilder {
    return this;
  }

  private getColumnSql(): string {
    return this.columnSql.length ? this.columnSql.join(', ') : null;
  }

  private getConstraintSql(): string {
    return this.constraintSql.length ? this.constraintSql.join(', ') : null;
  }

  // Finalize the builder and create the SQL statement.
  public toSql(): string {
    let column = this.getColumnSql();
    if (column === null) {
      throw new Error('InvalidSchemaError');
    }
    let constraint = this.getConstraintSql();
    let desc = constraint ? `${column}, ${constraint}` : column;
    return `create table ${this.name} (${desc})`;
  }

  public commit(): Promise<TransactionResults> {
    return this.db.execSQL(this.toSql());
  }

  public rollback(): Promise<void> {
    return this.db.rollback();
  }

  public getSchema(): TableSchema {
    return this.schema;
  }
}
