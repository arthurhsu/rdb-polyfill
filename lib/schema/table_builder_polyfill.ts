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
import {ColumnType, ForeignKeyAction, ForeignKeyTiming} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {IndexedColumnDefinition, IndexedColumnSpec, ITableBuilder} from '../spec/table_builder';
import {CommonBase} from './common_base';
import {Schema} from './schema';
import {ForeignKeySpec, IndexSpec, TableSchema} from './table_schema';

export class TableBuilderPolyfill extends QueryBase implements ITableBuilder {
  private columnSql: string[];
  private constraintSql: string[];
  private columnType: Map<string, ColumnType>;
  private schema: TableSchema;
  private dbName: string;
  private nameUsed: Set<string>;
  private indices: IndexSpec[];
  private foreignKeys: ForeignKeySpec[];

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
    this.foreignKeys = [];
  }

  private checkName(name: string, firstCheck = false): void {
    if (!validateName(name)) {
      throw new Error('SyntaxError');
    }

    let nameExists = this.nameUsed.has(name);
    let expectNameExists = !firstCheck;
    if (nameExists != expectNameExists) {
      throw new Error('SyntaxError');
    }

    this.nameUsed.add(name);
  }

  public column(name: string, type: ColumnType, notNull = false):
      ITableBuilder {
    this.checkName(name, true);
    this.columnType.set(name, type);
    this.columnSql.push(CommonBase.columnDefToSql(name, type, notNull));
    this.schema.column(name, type, notNull);
    return this;
  }

  public primaryKey(columns: string|string[], autoIncrement = false):
      ITableBuilder {
    if (this.schema._primaryKey !== null) {
      throw new Error('SyntaxError');
    }

    this.schema._primaryKey = [].concat(columns);
    this.schema._autoIncrement = autoIncrement;
    if (autoIncrement) {
      if (Array.isArray(columns)) {
        throw new Error('SyntaxError');
      }

      if (this.columnType.get(columns) != 'number') {
        throw new Error('InvalidSchemaError');
      }
      let name = columns + ' ';
      for (let i = 0; i < this.columnSql.length; ++i) {
        if (this.columnSql[i].startsWith(name)) {
          this.columnSql[i] =
             `${name}integer primary key ` +
             this.connection.autoIncrementKeyword;
          break;
        }
      }
      return this;
    }

    let index = CommonBase.normalizeIndex(columns, this.columnType);
    this.constraintSql.push(CommonBase.indexToSql('primary key', index));
    return this;
  }

  public foreignKey(name: string, column: string|string[],
      foreign: string|string[], action: ForeignKeyAction = 'restrict',
      timing: ForeignKeyTiming = 'immediate'): ITableBuilder {
    this.checkName(name, true);
    let localCols = [].concat(column);
    let remoteCols = [].concat(foreign);
    if (localCols.length == 0 || remoteCols.length == 0) {
      throw new Error('SyntaxError');
    }

    localCols.forEach(c => this.checkName(c));

    let refTable: string = null;
    remoteCols.forEach(ref => {
      let tokens = ref.split('.');
      if (tokens.length != 2) {
        throw new Error('SyntaxError');
      }
      if (refTable !== null && tokens[0] != refTable) {
        throw new Error('SyntaxError');
      } else {
        refTable = tokens[0];
      }
    });

    this.foreignKeys.push({
      name: name,
      local: localCols,
      remote: remoteCols,
      action: action,
      timing: timing
    });
    return this;
  }

  private getFKSql(): string {
    return this.foreignKeys.map(fk => {
      let refTable = fk.remote[0].split('.')[0];
      let refCols = fk.remote.map(ref => {
        return ref.split('.')[1];
      }).join(', ');
      let sql = ` constraint ${fk.name} foreign key (${fk.local.join(', ')}) ` +
          `references ${refTable}(${refCols})`;
      if (fk.action == 'cascade') {
        sql += ' on update cascade on delete cascade';
      }
      if (fk.timing == 'deferrable') {
        sql += ' deferrable';
      }
      return sql;
    }).join('');
  }

  public index(name: string, columns: IndexedColumnDefinition, unique = false):
      ITableBuilder {
    this.checkName(name, true);
    this.indices.push({
      name: name,
      column: CommonBase.normalizeIndex(columns, this.columnType),
      unique: unique
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
    let fkSql = this.getFKSql() || '';
    let indexSql = this.getIndexSql();
    let mainSql = `create table ${this.name} (${desc})${fkSql}`;
    return indexSql ? `${mainSql}; ${indexSql}` : mainSql;
  }

  public onCommit(conn: SqlConnection): void {
    let schema = conn.schema() as Schema;
    schema.reportTableChange(this.schema.getName(), this.schema);
  }

  public commit(): Promise<TransactionResults> {
    this.ensureContext();
    this.context.prepare(this.toSql());
    // TODO(arthurhsu): bookkeep indices
    this.context.prepare(
        `insert into "$rdb_table" values("${this.name}", "${this.dbName}")`);
    this.columnType.forEach((type, name) => {
      this.context.prepare(
          'insert into "$rdb_column" values ' +
          `("${name}", "${this.dbName}", "${this.name}", "${type}")`);
    });
    if (this.schema._primaryKey && this.schema._primaryKey.length) {
      this.context.prepare(
          `insert into "$rdb_relation" values("pk", "${this.dbName}", ` +
          `"${this.name}", "pk", "${this.schema._primaryKey.join(',')}", "", ` +
          `"${this.schema._autoIncrement ? 'autoInc' : ''}")`);
    }
    this.indices.forEach(index => {
      this.context.prepare(
          `insert into "$rdb_relation" values("${index.name}", ` +
          `"${this.dbName}", "${this.name}", "index",
          "${JSON.stringify(index.column).replace(/\"/g, '\'')}", "", ` +
          `"${index.unique ? 'unique' : ''}")`);
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
