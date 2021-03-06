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

import {IBindableValue} from './bindable_value';
import {IColumn} from './column';
import {Order} from './enums';
import {ILogicalPredicate} from './predicate';
import {IQuery} from './query';
import {ITable} from './table';

export interface ISelectQuery extends IQuery {
  from(...tables: ITable[]): ISelectQuery;
  where(searchCondition: ILogicalPredicate): ISelectQuery;
  innerJoin(table: ITable, joinCondition: ILogicalPredicate): ISelectQuery;
  leftOuterJoin(table: ITable, joinCondition: ILogicalPredicate): ISelectQuery;
  limit(numberOfRows: number|IBindableValue): ISelectQuery;
  skip(numberOfRows: number|IBindableValue): ISelectQuery;
  orderBy(column: IColumn, order?: Order): ISelectQuery;
  groupBy(...column: IColumn[]): ISelectQuery;
  union(...query: ISelectQuery[]): ISelectQuery;
  intersect(...query: ISelectQuery[]): ISelectQuery;
  except(...query: ISelectQuery[]): ISelectQuery;
}
