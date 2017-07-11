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
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {IDeleteQuery} from '../spec/delete_query';
import {ILogicalPredicate} from '../spec/predicate';
import {IQuery} from '../spec/query';
import {ITable} from '../spec/table';
import {QueryBase} from './query_base';
import {Sqlite3Connection} from './sqlite3_connection';

export class DeleteQueryBuilder extends QueryBase implements IDeleteQuery {
  private table: TableSchema;
  private schema: Schema;
  private searchCondition: LogicalPredicate;

  constructor(connection: Sqlite3Connection, schema: Schema) {
    super(connection);
    this.table = null;
    this.schema = schema;
    this.searchCondition = null;
  }

  public from(table: ITable): IDeleteQuery {
    if (this.table !== null) {
      throw new Error('SyntaxError');
    }

    this.table = table as TableSchema;
    return this;
  }

  public where(searchCondition: ILogicalPredicate): IDeleteQuery {
    this.searchCondition = searchCondition as LogicalPredicate;
    return this;
  }

  public clone(): IQuery {
    let that = new DeleteQueryBuilder(this.connection, this.schema);
    that.table = this.table;
    that.searchCondition =
        this.searchCondition ? this.searchCondition.clone() : null;
    that.cloneBoundValues(this);
    return that;
  }

  public toSql(): string[] {
    if (this.table === null) {
      throw new Error('SyntaxError');
    }

    let sql = `delete from ${this.table.getName()}`;
    sql += (this.searchCondition != null)
        ? ` where ${(this.searchCondition.toSql())};`
        : ';';
    return [sql];
  }
}
