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

import {SqlExecutionContext} from '../proc/sql_execution_context';
import {ColumnType, ValueType} from '../spec/enums';
import {TransactionResults} from '../spec/execution_context';
import {ForeignKeySpec, IndexSpec, PrimaryKeyDefinition} from '../spec/table_builder';
import {IColumnChanger, ITableChanger} from '../spec/table_changer';
import {CommonBase} from './common_base';

export class TableChangerPolyfill implements ITableChanger {
  private context: SqlExecutionContext;

  constructor(context: SqlExecutionContext, readonly name: string) {
    this.context = context;
  }

  public rename(newTableName: string): ITableChanger {
    this.context.prepare(`alter table ${this.name} rename to ${newTableName}`);
    return this;
  }

  public addColumn(
      name: string, type: ColumnType, notNull?: boolean,
      defaultValue?: ValueType): ITableChanger {
    let columnDef = CommonBase.columnDefToSql(name, type, notNull);
    this.context.prepare(`alter table ${this.name} add column ${columnDef}`);
    if (defaultValue !== undefined) {
      throw new Error('NotImplemented');
    }
    return this;
  }

  public dropColumn(name: string): ITableChanger {
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public addPrimaryKey(primaryKey: PrimaryKeyDefinition): ITableChanger {
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public dropPrimaryKey(): ITableChanger {
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public addForeignKey(foreignKey: ForeignKeySpec): ITableChanger {
    throw new Error('NotImplemented');
  }

  public addIndex(index: IndexSpec): ITableChanger {
    throw new Error('NotImplemented');
  }

  public dropConstraintOrIndex(name: string): ITableChanger {
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public setColumn(name: string): IColumnChanger {
    throw new Error('NotSupported: SQLite does not have native support');
  }

  public commit(): Promise<TransactionResults> {
    // TODO(arthurhsu): update existing cached schema
    return this.context.commit();
  }

  public rollback(): Promise<void> {
    return this.context.rollback();
  }

  public toSql(): string {
    return this.context.inspect().join('; ');
  }
}
