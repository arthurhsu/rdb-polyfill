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

import {BindableValueHolder} from '../schema/bindable_value_holder';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {IBindableValue} from '../spec/bindable_value';
import {ColumnType} from '../spec/enums';
import {RDBError} from '../spec/errors';
import {IInsertQuery} from '../spec/insert_query';
import {IQuery} from '../spec/query';
import {ITable} from '../spec/table';
import {QueryBase} from './query_base';
import {Sqlite3Connection} from './sqlite3_connection';
import {Sqlite3Context} from './sqlite3_context';

export class InsertQueryBuilder extends QueryBase implements IInsertQuery {
  private replace: boolean;
  private table: TableSchema;
  private schema: Schema;
  private value: object[];
  private keys: string[];
  private types: string[];
  private nullable: boolean[];

  constructor(connection: Sqlite3Connection, schema: Schema, replace = false) {
    super(connection);
    this.replace = replace;
    this.table = null;
    this.schema = schema;
    this.keys = null;
  }

  public into(table: ITable): IInsertQuery {
    if (this.table !== null) {
      throw RDBError.SyntaxError('insert into must have a table');
    }

    this.table = table as TableSchema;
    if (this.replace && this.table._primaryKey === null) {
      throw RDBError.IntegrityError(
          `table ${table.getName()} has no primary key`);
    }
    this.keys = Array.from(this.table._columns.keys());
    this.types = this.keys.map(k => {
      return this.table._columns.get(k).type;
    });
    this.nullable = this.keys.map(k => {
      return this.table._columns.get(k).nullable;
    });
    return this;
  }

  public values(rows: object|object[]|IBindableValue): IInsertQuery {
    if (rows instanceof BindableValueHolder) {
      // This query can have only one bounded value.
      this.boundValues.set(0, rows);
    } else {
      this.value = Array.isArray(rows) ? rows : [rows];
    }
    return this;
  }

  public clone(): IQuery {
    let that =
        new InsertQueryBuilder(this.connection, this.schema, this.replace);
    that.table = this.table;
    that.value = this.value;
    that.keys = this.keys;
    that.types = this.types;
    that.nullable = this.nullable;
    return that;
  }

  public toSql(): string[] {
    if (this.table === null) {
      throw RDBError.SyntaxError('insert has no table');
    }

    let prefix = this.replace ? 'insert or replace' : 'insert';
    let keyString = this.keys.join(',');
    let val = '?,'.repeat(this.keys.length - 1) + '?';
    return [
      `${prefix} into ${this.table.getName()}(${keyString}) values(${val});`
    ];
  }

  private convertValue(val: Object): any[] {
    let result: any[] = this.keys.map((k, i) => {
      if (val.hasOwnProperty(k)) {
        return super.toValueString(val[k], this.types[i] as ColumnType);
      } else if (this.nullable[i]) {
        return 'null';
      } else {
        throw RDBError.DataError();
      }
    });

    return result;
  }

  protected preCommit(context: Sqlite3Context): void {
    if (this.value) {
      this.value.forEach(v => {
        context.bind(this.convertValue(v));
      });
    } else if (this.boundValues.size > 0) {
      let val = this.boundValues.get(0);
      if (!val) {
        throw RDBError.BindingError();
      }
      if (Array.isArray(val)) {
        // multi-rows
        val.forEach(v => {
          context.bind(this.convertValue(v));
        });
      } else {
        context.bind(this.convertValue(val));
      }
    } else {
      throw RDBError.SyntaxError();
    }
  }
}