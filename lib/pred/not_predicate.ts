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
import {ILogicalPredicate} from '../spec/predicate';
import {LogicalPredicateBase} from './logical_predicate_base';

export class NotPredicate extends LogicalPredicateBase {
  readonly predicate: LogicalPredicateBase;

  constructor(predicate: ILogicalPredicate) {
    super();
    this.predicate = predicate as LogicalPredicateBase;
  }

  public toSql(): string {
    this.baseSql = `not (${this.predicate.toSql()})`;
    return super.toSql();
  }

  public createBinderMap(map: Map<number, BindableValueHolder>) {
    this.predicate.createBinderMap(map);
    super.createBinderMap(map);
  }

  public clone(): NotPredicate {
    let that = new NotPredicate(this.predicate.clone());
    that.cloneChain(this);
    return that;
  }
}
