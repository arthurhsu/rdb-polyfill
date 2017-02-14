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
import {SqlConnection} from '../proc/sql_connection';
import {ColumnType, ValueType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {IQuery} from '../spec/query';
import {ForeignKeySpec, IndexSpec, PrimaryKeyDefinition} from '../spec/table_builder';
import {IColumnChanger, ITableChanger} from '../spec/table_changer';
import {CommonBase} from './common_base';

export class TableChangerPolyfill extends QueryBase implements ITableChanger {
  private dbName: string;
  private sqls: string[];

  constructor(
      connection: SqlConnection, readonly name: string, dbName: string) {
    super(connection, true);
    this.dbName = dbName;
    this.sqls = [];
  }

  public rename(newTableName: string): ITableChanger {
    this.sqls.push(`alter table ${this.name} rename to ${newTableName}`);
    return this;
  }

  public addColumn(
      name: string, type: ColumnType, notNull?: boolean,
      defaultValue?: ValueType): ITableChanger {
    let columnDef = CommonBase.columnDefToSql(name, type, notNull);
    this.sqls.push(`alter table ${this.name} add column ${columnDef}`);
    if (defaultValue !== undefined) {
      // TODO(arthurhsu): implement
      throw new Error('NotImplemented');
    }
    return this;
  }

  public dropColumn(name: string): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public addPrimaryKey(primaryKey: PrimaryKeyDefinition): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public dropPrimaryKey(): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public addForeignKey(foreignKey: ForeignKeySpec): ITableChanger {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public addIndex(index: IndexSpec): ITableChanger {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public dropConstraintOrIndex(name: string): ITableChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public setColumn(name: string): IColumnChanger {
    // TODO(arthurhsu): implement, heavy lifting is possible
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public commit(): Promise<TransactionResults> {
    // TODO(arthurhsu): update existing cached schema
    return super.commit();
  }

  public toSql(): string {
    return this.sqls.join('; ');
  }

  public clone(): IQuery {
    throw new Error('UnsupportedError');
  }

  public createBinderMap(): void {
    // Do nothing.
  }
}
