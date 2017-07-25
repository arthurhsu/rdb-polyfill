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

import {LogicalPredicate} from '../pred/logical_predicate';
import {ColumnSchema} from '../schema/column_schema';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {IBindableValue} from '../spec/bindable_value';
import {IColumn} from '../spec/column';
import {Order} from '../spec/enums';
import {RDBError} from '../spec/errors';
import {TransactionResults} from '../spec/execution_context';
import {ILogicalPredicate} from '../spec/predicate';
import {IQuery} from '../spec/query';
import {ISelectQuery} from '../spec/select_query';
import {ITable} from '../spec/table';
import {QueryBase} from './query_base';
import {Sqlite3Connection} from './sqlite3_connection';

type SubQueryType = {
  op: string,
  query: ISelectQuery
};

type JoinType = {
  op: string,
  table: ITable,
  on: ILogicalPredicate
};

export class SelectQueryBuilder extends QueryBase implements ISelectQuery {
  private tables: Map<string, TableSchema>;
  private columns: ColumnSchema[];
  private schema: Schema;
  private searchCondition: LogicalPredicate;
  private limitCount: number|IBindableValue;
  private skipCount: number|IBindableValue;
  private ordering: string[];
  private grouping: string[];
  private subqueries: SubQueryType[];
  private joins: JoinType[];
  private conversion: Map<string, string>;

  constructor(connection: Sqlite3Connection, schema: Schema, columns: IColumn[]) {
    super(connection);
    this.tables = new Map<string, TableSchema>();
    this.schema = schema;
    this.columns = [];
    this.ordering = [];
    this.grouping = [];
    this.subqueries = [];
    this.joins = [];
    columns.forEach(col => this.columns.push(col as ColumnSchema));
    this.conversion = null;
  }

  public from(...tables: ITable[]): ISelectQuery {
    if (tables.length == 0) {
      throw RDBError.SyntaxError('select from must have table');
    }
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
    this.joins.push({op: 'inner join', table: table, on: joinCondition});
    return this;
  }

  public leftOuterJoin(table: ITable, joinCondition: ILogicalPredicate):
      ISelectQuery {
    this.joins.push({op: 'left join', table: table, on: joinCondition});
    return this;
  }

  public limit(numberOfRows: number|IBindableValue): ISelectQuery {
    if (this.limitCount) {
      throw RDBError.SyntaxError('limit already called');
    }
    this.limitCount = numberOfRows;
    return this;
  }

  public skip(numberOfRows: number|IBindableValue): ISelectQuery {
    if (this.skipCount) {
      throw RDBError.SyntaxError('skip already called');
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
      throw RDBError.SyntaxError('group by must have aggregated columns');
    }
    column.forEach(col => this.grouping.push(col.fullName));
    return this;
  }

  private subquery(op: string, queries: ISelectQuery[]): ISelectQuery {
    queries.forEach(q => this.subqueries.push({op: op, query: q}));
    return this;
  }

  public union(...query: ISelectQuery[]): ISelectQuery {
    return this.subquery('union', query);
  }

  public intersect(...query: ISelectQuery[]): ISelectQuery {
    return this.subquery('intersect', query);
  }

  public except(...query: ISelectQuery[]): ISelectQuery {
    return this.subquery('except', query);
  }

  public clone(): IQuery {
    let that =
        new SelectQueryBuilder(this.connection, this.schema, this.columns);
    this.tables.forEach((value, key) => {
      that.tables.set(key, value);
    });
    if (this.searchCondition) {
      that.searchCondition = this.searchCondition.clone();
    }
    that.limitCount = this.limitCount;
    that.skipCount = this.skipCount;
    that.ordering = this.ordering.concat([]);
    that.grouping = this.grouping.concat([]);
    that.subqueries = this.subqueries.concat([]);
    that.joins = this.joins.concat([]);
    return that;
  }

  private getTableName(table: ITable): string {
    return table.getAlias() ? `${table.getName()} ${table.getAlias()}` :
                              table.getName();
  }

  public toSql(terminating = true): string[] {
    let projection = this.columns.length ?
        this.columns.map(col => col.fullName).join(', ') :
        '*';
    let tableList = Array.from(this.tables.values())
                        .map(table => this.getTableName(table))
                        .join(', ');
    let sql = `select ${projection} from ${tableList}`;

    if (this.joins.length) {
      let joinSql =
          this.joins
              .map(j => {
                let condition = (j.on as LogicalPredicate).toSql();
                return `${j.op} ${this.getTableName(j.table)} on ${condition}`;
              })
              .join(' ');
      sql += ' ' + joinSql;
    }

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

    if (this.subqueries.length) {
      let subquerySqls = this.subqueries.map(q => {
        return `${q.op} (${q.query.toSql()})`;
      });
      sql = `${sql} ${subquerySqls.join(' ')}`;
    }

    // Note that SELECT queries are not terminated in semicolons because
    // it's not worth doing it and put a bunch of engineering efforts for
    // handling subqueries.
    return [sql];
  }

  private ensureConversionTable(): void {
    if (this.conversion) {
      return;  // already constructed
    }

    this.conversion = new Map<string, string>();
    let columns: ColumnSchema[] = [];
    if (this.columns.length) {
      columns = this.columns;
    } else {
      this.tables.forEach(table => {
        columns = columns.concat(Array.from(table._columns.values()));
      });
    }

    columns.forEach(col => {
      if (col.type == 'blob' || col.type == 'boolean' ||
          col.type == 'date' || col.type == 'object') {
        if (col.alias) {
          this.conversion.set(col.alias, col.type);
        } else {
          this.conversion.set(col.fullName, col.type);
          this.conversion.set(col.name, col.type);
        }
      }
    });
  }

  private convertProjection(res: object[]): object[] {
    this.ensureConversionTable();
    return res.map(o => {
      let val = {};
      for (let key in o) {
        if (this.conversion.has(key)) {
          val[key] = this.toValue(o[key], this.conversion.get(key));
        } else {
          val[key] = o[key];
        }
      }
      return val;
    });
  }

  protected postCommit(res: TransactionResults): TransactionResults {
    return res ? this.convertProjection(res as object[]) : [];
  }
}
