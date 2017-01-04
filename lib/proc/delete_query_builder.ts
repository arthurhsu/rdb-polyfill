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

import {LogicalPredicate} from '../schema/logical_predicate';
import {Schema, TableSchema} from '../schema/schema';
import {IDeleteQuery} from '../spec/delete_query';
import {ILogicalPredicate} from '../spec/predicate';
import {IQuery} from '../spec/query';
import {ITable} from '../spec/table';
import {QueryBase} from './query_base';
import {SQLDB} from './sql_db';

export class DeleteQueryBuilder extends QueryBase implements IDeleteQuery {
  private table: TableSchema;
  private schema: Schema;
  private searchCondition: ILogicalPredicate;

  constructor(db: SQLDB, schema: Schema, replace = false) {
    super(db);
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
    this.searchCondition = searchCondition;
    return this;
  }

  public clone(): IQuery {
    throw new Error('Not implemented');
  }

  public toSql(): string {
    if (this.table === null) {
      throw new Error('SyntaxError');
    }

    let base = `delete from ${this.table._name}`;
    if (this.searchCondition == null) {
      return base;
    }

    base += ` where ${(this.searchCondition as LogicalPredicate).sql}`;
    return this.bindValues(base);
  }
}
