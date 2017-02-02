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

import {BindableValueHolder} from '../schema/bindable_value_holder';
import {ColumnSchema} from '../schema/column_schema';
import {LogicalPredicate} from '../schema/logical_predicate';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {IBindableValue} from '../spec/bindable_value';
import {IColumn} from '../spec/column';
import {Order} from '../spec/enums';
import {ILogicalPredicate} from '../spec/predicate';
import {IQuery} from '../spec/query';
import {ISelectQuery} from '../spec/select_query';
import {ITable} from '../spec/table';
import {QueryBase} from './query_base';
import {SqlConnection} from './sql_connection';

export class SelectQueryBuilder extends QueryBase implements ISelectQuery {
  private tables: Map<string, TableSchema>;
  private columns: ColumnSchema[];
  private schema: Schema;
  private searchCondition: LogicalPredicate;
  private limitCount: number|IBindableValue;
  private skipCount: number|IBindableValue;
  private ordering: string[];
  private grouping: string[];

  constructor(connection: SqlConnection, schema: Schema, columns: IColumn[]) {
    super(connection);
    this.tables = new Map<string, TableSchema>();
    this.schema = schema;
    this.columns = [];
    this.ordering = [];
    this.grouping = [];
    columns.forEach(col => this.columns.push(col as ColumnSchema));
  }

  public from(...tables: ITable[]): ISelectQuery {
    if (tables.length == 0) throw new Error('SyntaxError');
    tables.forEach(tbl => {
      let table = tbl as TableSchema;
      this.tables.set(table.getAlias() || table.getName(), table);
    });
    return this;
  }

  public where(searchCondition: ILogicalPredicate): ISelectQuery {
    this.searchCondition = searchCondition as LogicalPredicate;
    return this;
  }

  public innerJoin(table: ITable, joinCondition: ILogicalPredicate):
      ISelectQuery {
    throw new Error('NotImplemented');
  }

  public leftOuterJoin(table: ITable, joinCondition: ILogicalPredicate):
      ISelectQuery {
    throw new Error('NotImplemented');
  }

  public limit(numberOfRows: number|IBindableValue): ISelectQuery {
    if (this.limitCount) {
      throw new Error('SyntaxError');
    }
    this.limitCount = numberOfRows;
    return this;
  }

  public skip(numberOfRows: number|IBindableValue): ISelectQuery {
    if (this.skipCount) {
      throw new Error('SyntaxError');
    }
    this.skipCount = numberOfRows;
    return this;
  }

  public orderBy(column: IColumn, order = 'asc' as Order): ISelectQuery {
    this.ordering.push(`${column.fullName} ${order}`);
    return this;
  }

  public groupBy(...column: IColumn[]): ISelectQuery {
    if (this.grouping.length > 0) {
      throw new Error('SyntaxError');
    }
    column.forEach(col => this.grouping.push(col.fullName));
    return this;
  }

  public union(...query: ISelectQuery[]): ISelectQuery {
    throw new Error('NotImplemented');
  }

  public intersect(...query: ISelectQuery[]): ISelectQuery {
    throw new Error('NotImplemented');
  }

  public except(...query: ISelectQuery[]): ISelectQuery {
    throw new Error('NotImplemented');
  }

  public createBinderMap(): void {
    if (this.searchCondition) {
      this.searchCondition.createBinderMap(this.boundValues);
    }

    [this.skipCount, this.limitCount].forEach(value => {
      if (value instanceof BindableValueHolder) {
        this.boundValues.set(value.index, value);
      }
    });
  }

  public clone(): IQuery {
    throw new Error('Not implemented');
  }

  public toSql(): string {
    let projection = this.columns.length ?
        this.columns.map(col => col.fullName).join(', ') :
        '*';
    let tableList = Array.from(this.tables.values())
                        .map(table => {
                          return table.getAlias() ?
                              `${table.getName()} ${table.getAlias()}` :
                              table.getName();
                        })
                        .join(', ');
    let sql = `select ${projection} from ${tableList}`;
    if (this.searchCondition) {
      sql += ` where ${this.searchCondition.toSql()}`;
    }

    if (this.ordering.length > 0) {
      sql += ` order by ${this.ordering.join(', ')}`;
    }

    if (this.grouping.length > 0) {
      sql += ` group by ${this.grouping.join(', ')}`;
    }

    if (this.limitCount) {
      sql += ` limit ${this.toValueString(this.limitCount, 'number')}`;
    }

    if (this.skipCount) {
      sql += ` skip ${this.toValueString(this.skipCount, 'number')}`;
    }

    // TODO(arthurhsu): orderby, groupby, union, ...
    return sql;
  }
}
