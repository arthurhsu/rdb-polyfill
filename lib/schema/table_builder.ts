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
import {Sqlite3Connection} from '../proc/sqlite3_connection';
import {Sqlite3Context} from '../proc/sqlite3_context';
import {ColumnType, ForeignKeyAction, ForeignKeyTiming} from '../spec/enums';
import {RDBError} from '../spec/errors';
import {IQuery} from '../spec/query';
import {IndexedColumnDefinition, IndexedColumnSpec, ITableBuilder} from '../spec/table_builder';

import {SqlHelper} from './sql_helper';
import {TableSchema} from './table_schema';

export class TableBuilder extends QueryBase implements ITableBuilder {
  private columnSql: string[];
  private constraintSql: string[];
  private columnType: Map<string, ColumnType>;
  private schema: TableSchema;
  private dbName: string;
  private nameUsed: Set<string>;

  constructor(readonly connection: Sqlite3Connection, readonly name: string,
      dbName: string) {
    super(connection);
    this.columnSql = [];
    this.constraintSql = [];
    this.columnType = new Map<string, ColumnType>();
    this.dbName = dbName;
    this.schema = new TableSchema(name);
    this.nameUsed = new Set<string>();
  }

  private checkName(name: string, firstCheck = false): void {
    if (!validateName(name)) {
      throw RDBError.InvalidSchemaError(`illegal name ${name}`);
    }

    let nameExists = this.nameUsed.has(name);
    let expectNameExists = !firstCheck;
    if (nameExists != expectNameExists) {
      throw RDBError.InvalidSchemaError(`invalid name ${name}`);
    }

    this.nameUsed.add(name);
  }

  public attach(context: Sqlite3Context) {
    super.attach(context);
    context.reportTableChange(this.name, this.schema);
  }

  public column(name: string, type: ColumnType, notNull = false):
      ITableBuilder {
    this.checkName(name, true);
    this.columnType.set(name, type);
    this.columnSql.push(SqlHelper.columnDefToSql(name, type, notNull));
    this.schema.column(name, type, notNull);
    return this;
  }

  public primaryKey(columns: string|string[], autoIncrement = false):
      ITableBuilder {
    if (this.schema._primaryKey !== null) {
      throw RDBError.InvalidSchemaError('primary key already defined');
    }

    this.schema._primaryKey = [].concat(columns);
    this.schema._autoIncrement = autoIncrement;
    if (autoIncrement) {
      if (Array.isArray(columns)) {
        throw RDBError.InvalidSchemaError(
            'auto increment must be single column');
      }

      if (this.columnType.get(columns) != 'integer') {
        throw RDBError.InvalidSchemaError(
            'auto increment must be integer column');
      }
      let name = columns + ' ';
      for (let i = 0; i < this.columnSql.length; ++i) {
        if (this.columnSql[i].startsWith(name)) {
          this.columnSql[i] += ' primary key autoincrement';
          break;
        }
      }
      return this;
    }

    if (!Array.isArray(columns)) {
      this.schema._notNull.add(columns);
    }
    let index = SqlHelper.normalizeIndex(columns, this.columnType);
    this.constraintSql.push(SqlHelper.indexToSql('primary key', index));
    return this;
  }

  public foreignKey(name: string, column: string|string[],
      foreign: string|string[], action: ForeignKeyAction = 'restrict',
      timing: ForeignKeyTiming = 'immediate'): ITableBuilder {
    this.checkName(name, true);
    let localCols = [].concat(column);
    let remoteCols = [].concat(foreign);
    if (localCols.length == 0 || remoteCols.length == 0) {
      throw RDBError.InvalidSchemaError('invalid foreign key spec');
    }

    localCols.forEach(c => this.checkName(c));

    let refTable: string = null;
    remoteCols.forEach(ref => {
      let tokens = ref.split('.');
      if (tokens.length != 2) {
        throw RDBError.InvalidSchemaError('invalid foreign key ref');
      }
      if (refTable !== null && tokens[0] != refTable) {
        throw RDBError.InvalidSchemaError('invalid foreign key ref table');
      } else {
        refTable = tokens[0];
      }
    });

    this.schema._foreignKey.push({
      name: name,
      local: localCols,
      remote: remoteCols,
      action: action,
      timing: timing
    });
    return this;
  }

  private getFKSql(): string {
    return this.schema._foreignKey.map(fk => {
      let refTable = fk.remote[0].split('.')[0];
      let refCols = fk.remote.map(ref => {
        return ref.split('.')[1];
      }).join(', ');
      let sql =
          `, constraint ${fk.name} foreign key (${fk.local.join(', ')}) ` +
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
    this.schema._indices.push({
      name: name,
      column: SqlHelper.normalizeIndex(columns, this.columnType),
      unique: unique
    });

    return this;
  }

  private getIndexSql(): string[] {
    return this.schema._indices.map(index => {
      let unique = index.unique ? 'unique ' : '';
      return SqlHelper.indexToSql(
          `create ${unique}index ${index.name} on ${this.name}`,
          index.column as IndexedColumnSpec[]) + ';';
    });
  }

  private getColumnSql(): string {
    return this.columnSql.length ? this.columnSql.join(', ') : null;
  }

  private getConstraintSql(): string {
    return this.constraintSql.length ? this.constraintSql.join(', ') : null;
  }

  // Finalize the builder and create the SQL statement.
  public toSql(): string[] {
    let column = this.getColumnSql();
    if (column === null) {
      throw RDBError.InvalidSchemaError('no columns');
    }
    let constraint = this.getConstraintSql();
    let desc = constraint ? `${column}, ${constraint}` : column;
    let fkSql = this.getFKSql() || '';
    let indexSql = this.getIndexSql();
    let mainSql = `create table ${this.name} (${desc}${fkSql});`;
    return [].concat(mainSql).concat(indexSql);
  }

  public prefixSqls(): string[] {
    let sqls: string[] = [];

    sqls.push(
        `insert into "$rdb_table" values("${this.name}", "${this.dbName}");`);
    this.columnType.forEach((type, name) => {
      let nul = this.schema._notNull.has(name) ? 1 : 0;
      sqls.push(
          'insert into "$rdb_column" values (' +
          `"${name}", "${this.dbName}", "${this.name}", "${type}", ${nul});`);
    });
    if (this.schema._primaryKey && this.schema._primaryKey.length) {
      sqls.push(
          `insert into "$rdb_relation" values("pk", "${this.dbName}", ` +
          `"${this.name}", "pk", "${this.schema._primaryKey.join(',')}", "", ` +
          `"${this.schema._autoIncrement ? 'autoInc' : ''}");`);
    }
    this.schema._indices.forEach(index => {
      sqls.push(
          `insert into "$rdb_relation" values("${index.name}", ` +
          `"${this.dbName}", "${this.name}", "index",` +
          `"${JSON.stringify(index.column).replace(/\"/g, '\'')}", "", ` +
          `"${index.unique ? 'unique' : ''}");`);
    });
    this.schema._foreignKey.forEach(fk => {
      sqls.push(
          `insert into "$rdb_relation" values("${fk.name}", ` +
          `"${this.dbName}", "${this.name}", "fk", ` +
          `"${JSON.stringify(fk).replace(/\"/g, '\'')}", "", "")`);
    });

    return sqls;
  }

  public getSchema(): TableSchema {
    return this.schema;
  }

  public clone(): IQuery {
    // By spec, clone() is not valid for TableBuilder.
    throw RDBError.SyntaxError();
  }
}