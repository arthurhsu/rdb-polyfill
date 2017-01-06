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

import {ILogicalPredicate} from '../spec/predicate';
import {BindableValueHolder} from './bindable_value_holder';
import {PredicateHolder} from './predicate_holder';

export class LogicalPredicate implements ILogicalPredicate {
  private lhs: PredicateHolder|LogicalPredicate;
  private sql: string;
  private operands: ILogicalPredicate[];

  constructor(lhs: PredicateHolder|LogicalPredicate) {
    this.lhs = lhs;
    this.sql = null;
    this.operands = null;
  }

  public and(...values: ILogicalPredicate[]): ILogicalPredicate {
    if (this.sql !== null) throw new Error('SyntaxError');
    this.sql = ' and ';
    this.operands = values;
    return this;
  }

  public or(...values: ILogicalPredicate[]): ILogicalPredicate {
    if (this.sql !== null) throw new Error('SyntaxError');
    this.sql = ' or ';
    this.operands = values;
    return this;
  }

  public toSql(): string {
    if (this.sql === null && this.operands === null) {
      return this.lhs.toSql();
    }

    let sqlExpressions =
        this.operands.map(val => `(${(val as LogicalPredicate).toSql()})`);
    return `(${this.lhs.toSql()})${this.sql}${sqlExpressions.join(this.sql)}`;
  }

  public createBinderMap(map: Map<number, BindableValueHolder>) {
    this.lhs.createBinderMap(map);
    if (this.operands) {
      this.operands.forEach(
          op => (op as LogicalPredicate).createBinderMap(map));
    }
  }
}
