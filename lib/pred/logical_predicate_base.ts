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

export abstract class LogicalPredicateBase implements ILogicalPredicate {
  protected baseSql: string;
  protected chain: Array<{sql: string, operands: LogicalPredicateBase[]}>;

  constructor() {
    this.chain = [];
  }

  public and(...values: ILogicalPredicate[]): ILogicalPredicate {
    this.chain.push({sql: 'and', operands: values as LogicalPredicateBase[]});
    return this;
  }

  public or(...values: ILogicalPredicate[]): ILogicalPredicate {
    this.chain.push({sql: 'or', operands: values as LogicalPredicateBase[]});
    return this;
  }

  public abstract clone(): ILogicalPredicate;

  protected cloneChain(source: LogicalPredicateBase): void {
    this.chain = source.chain.map(target => {
      return {
        sql: target.sql,
        operands: target.operands.map(v => v.clone()) as LogicalPredicateBase[]
      };
    });
  }

  public toSql(): string {
    let lhs = this.baseSql;
    for (let i = 0; i < this.chain.length; ++i) {
      let target = this.chain[i];
      let rhs = target.operands
                    .map(val => `(${(val as LogicalPredicateBase).toSql()})`)
                    .join(` ${target.sql} `);
      lhs = `(${lhs}) ${target.sql} ${rhs}`;
    }
    return lhs;
  }
}
