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

import {QueryBase} from '../proc/query_base';
import {Sqlite3Connection} from '../proc/sqlite3_connection';
import {Sqlite3Context} from '../proc/sqlite3_context';
import {ColumnType, ForeignKeyAction, ForeignKeyTiming, ValueType} from '../spec/enums';
import {RDBError} from '../spec/errors';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {IndexedColumnDefinition} from '../spec/table_builder';
import {IColumnChanger, ITableChanger} from '../spec/table_changer';
import {SqlHelper} from './sql_helper';

export class TableChanger extends QueryBase implements ITableChanger {
  private dbName: string;
  private sqls: string[];

  constructor(readonly connection: Sqlite3Connection, public name: string,
      dbName: string) {
    super(connection);
    this.dbName = dbName;
    this.sqls = [];
  }

  public rename(newTableName: string): ITableChanger {
    this.sqls.push(`alter table ${this.name} rename to ${newTableName};`);
    this.name = newTableName;
    return this;
  }

  public addColumn(
      name: string, type: ColumnType, notNull?: boolean,
      defaultValue?: ValueType): ITableChanger {
    let columnDef = SqlHelper.columnDefToSql(name, type, notNull);
    let sql = `alter table ${this.name} add column ${columnDef}`;
    if (defaultValue !== undefined) {
      sql += ` default ${this.toQuotedValueString(defaultValue, type)};`;
    }
    this.sqls.push(sql);
    return this;
  }

  public dropColumn(name: string): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw RDBError.UnsupportedError('SQLite does not have native support');
  }

  public addPrimaryKey(columns: string|string[]): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw RDBError.UnsupportedError('SQLite does not have native support');
  }

  public dropPrimaryKey(): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    // Note: SQLite does not support dropping primary key.
    throw RDBError.UnsupportedError('SQLite does not have native support');
  }

  public addForeignKey(
      name: string, column: string|string[], foreign: string|string[],
      action: ForeignKeyAction = 'restrict',
      timing: ForeignKeyTiming = 'immediate'): ITableChanger {
    // TODO(arthurhsu): implement
    throw RDBError.RuntimeError('NotImplemented');
  }

  public addIndex(
      name: string, columns: IndexedColumnDefinition,
      unique = false): ITableChanger {
    // TODO(arthurhsu): implement
    throw RDBError.RuntimeError('NotImplemented');
  }

  public dropConstraintOrIndex(name: string): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw RDBError.UnsupportedError('SQLite does not have native support');
  }

  public setColumn(name: string): IColumnChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw RDBError.UnsupportedError('SQLite does not have native support');
  }

  public commit(): Promise<TransactionResults> {
    // TODO(arthurhsu): implement
    throw RDBError.RuntimeError('NotImplemented');
  }

  public toSql(): string[] {
    return this.sqls;
  }

  public clone(): IQuery {
    // By spec, clone() is not provided in TableChanger.
    throw RDBError.SyntaxError();
  }

  public attach(context: Sqlite3Context) {
    // TODO(arthurhsu): implement reportTableChange to schema
    throw RDBError.RuntimeError('NotImplemented');
  } 
}
