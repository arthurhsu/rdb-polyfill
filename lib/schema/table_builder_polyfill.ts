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

import {QueryBase} from '../proc/query_base';
import {SqlConnection} from '../proc/sql_connection';
import {ColumnType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {ForeignKeySpec, IndexSpec, ITableBuilder, PrimaryKeyDefinition} from '../spec/table_builder';
import {CommonBase} from './common_base';
import {TableSchema} from './table_schema';

export class TableBuilderPolyfill extends QueryBase implements ITableBuilder {
  private columnSql: string[];
  private constraintSql: string[];
  private columnType: Map<string, ColumnType>;
  private schema: TableSchema;
  private dbName: string;

  constructor(connection: SqlConnection, readonly name: string,
       dbName: string) {
    super(connection);
    this.columnSql = [];
    this.constraintSql = [];
    this.columnType = new Map<string, ColumnType>();
    this.dbName = dbName;

    this.schema = new TableSchema(name);
  }

  public column(name: string, type: ColumnType, notNull = false):
      ITableBuilder {
    if (this.columnType.has(name)) {
      throw new Error('SyntaxError');
    }

    this.columnType.set(name, type);
    this.columnSql.push(CommonBase.columnDefToSql(name, type, notNull));
    this.schema.column(name, type, notNull);
    return this;
  }

  public primaryKey(primaryKey: PrimaryKeyDefinition): ITableBuilder {
    let type = this.columnType.get(primaryKey as string);
    if (type == 'blob' || type == 'object') {
      throw new Error('InvalidSchemaError');
    }

    this.constraintSql.push(CommonBase.primaryKeyToSql(primaryKey));
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
    this.ensureContext();
    this.context.prepare(this.toSql());
    this.context.prepare(
        `insert into "$rdb_table" values ("${this.name}", "${this.dbName}")`);
    this.columnType.forEach((type, name) => {
      this.context.prepare(
          'insert into "$rdb_column" values ' +
          `("${name}", "${this.dbName}", "${this.name}", "${type}")`);
    });
    this.context.reportSchemaChange(this.schema.getName(), this.schema);
    return this.context.commit();
  }

  public getSchema(): TableSchema {
    return this.schema;
  }

  public clone(): IQuery {
    throw new Error('Unsupported');
  }

  public createBinderMap(): void {
    // Do nothing.
  }
}
