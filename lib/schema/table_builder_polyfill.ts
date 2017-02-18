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

import {validateName} from '../base/assert';
import {QueryBase} from '../proc/query_base';
import {SqlConnection} from '../proc/sql_connection';
import {ColumnType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {AutoIncrementPrimaryKey, ForeignKeySpec, IndexedColumnSpec, IndexSpec, ITableBuilder, PrimaryKeyDefinition} from '../spec/table_builder';
import {CommonBase} from './common_base';
import {Schema} from './schema';
import {TableSchema} from './table_schema';

export class TableBuilderPolyfill extends QueryBase implements ITableBuilder {
  private columnSql: string[];
  private constraintSql: string[];
  private columnType: Map<string, ColumnType>;
  private schema: TableSchema;
  private dbName: string;
  private nameUsed: Set<string>;
  private indices: IndexSpec[];

  constructor(
      connection: SqlConnection, readonly name: string, dbName: string) {
    super(connection, true);
    this.columnSql = [];
    this.constraintSql = [];
    this.columnType = new Map<string, ColumnType>();
    this.dbName = dbName;
    this.schema = new TableSchema(name);
    this.indices = [];
    this.nameUsed = new Set<string>();
  }

  private checkName(name: string): void {
    if (this.nameUsed.has(name) || !validateName(name)) {
      throw new Error('SyntaxError');
    }
    this.nameUsed.add(name);
  }

  public column(name: string, type: ColumnType, notNull = false):
      ITableBuilder {
    this.checkName(name);
    this.columnType.set(name, type);
    this.columnSql.push(CommonBase.columnDefToSql(name, type, notNull));
    this.schema.column(name, type, notNull);
    return this;
  }

  public primaryKey(pk: PrimaryKeyDefinition): ITableBuilder {
    if (typeof pk == 'object' && pk['autoIncrement'] !== undefined) {
      // AutoIncrement PK, need special care.
      let key = pk as AutoIncrementPrimaryKey;
      if (this.columnType.get(key.name) != 'number') {
        throw new Error('InvalidSchemaError');
      }
      let name = key.name + ' ';
      for (let i = 0; i < this.columnSql.length; ++i) {
        if (this.columnSql[i].startsWith(name)) {
          this.columnSql[i] =
             `${key.name} integer primary key ` +
             this.connection.autoIncrementKeyword;
          break;
        }
      }
      return this;
    }

    let index = CommonBase.normalizeIndex(pk, this.columnType);
    this.constraintSql.push(CommonBase.indexToSql('primary key', index));
    return this;
  }

  public foreignKey(foreignKey: ForeignKeySpec): ITableBuilder {
    // TODO(arthurhsu): implement
    return this;
  }

  public index(index: IndexSpec): ITableBuilder {
    this.checkName(index.name);

    if (index.unique && index.type == 'fulltext') {
      throw new Error('SyntaxError');
    }

    if (index.type == 'fulltext') {
      // TODO(arthurhsu): consider how to implement this, or withdraw from spec.
      throw new Error('UnsupportedError');
    }

    this.indices.push({
      name: index.name,
      column: CommonBase.normalizeIndex(index.column, this.columnType),
      type: index.type || 'btree',
      unique: index.unique || false
    });

    return this;
  }

  private getIndexSql(): string {
    return this.indices.map(index => {
      let unique = index.unique ? 'unique ' : '';
      return CommonBase.indexToSql(
          `create ${unique}index ${index.name} on ${this.name}`,
          index.column as IndexedColumnSpec[]);
    }).join('; ');
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
    let indexSql = this.getIndexSql();
    let mainSql = `create table ${this.name} (${desc})`;
    return indexSql ? `${mainSql}; ${indexSql}` : mainSql;
  }

  public onCommit(conn: SqlConnection): void {
    let schema = conn.schema() as Schema;
    schema.reportTableChange(this.schema.getName(), this.schema);
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
    return this.context.commit();
  }

  public getSchema(): TableSchema {
    return this.schema;
  }

  public clone(): IQuery {
    // Does not support for this query.
    throw new Error('UnsupportedError');
  }

  public createBinderMap(): void {
    // Do nothing.
  }
}
