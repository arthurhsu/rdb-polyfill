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

import {IBindableValue} from '../spec/bindable_value';
import {Column, IColumn} from '../spec/column';
import {ColumnType, ComparableValueType} from '../spec/enums';
import {ILogicalPredicate, OperandType} from '../spec/predicate';
import {LogicalPredicate} from './logical_predicate';
import {BinaryPredicateHolder, UnaryPredicateHolder} from './predicate_holder';

export class ColumnSchema extends Column {
  readonly fullName: string;

  constructor(
      readonly tableName: string, readonly name: string,
      readonly type: ColumnType, readonly nullable: boolean,
      readonly alias: string = null) {
    super();
    this.fullName = `${tableName}.${name}`;
  }

  public as(alias: string): IColumn {
    return new ColumnSchema(
        this.tableName, this.name, this.type, this.nullable, alias);
  }

  public eq(value: OperandType): ILogicalPredicate {
    return new LogicalPredicate(new BinaryPredicateHolder(this, '=', value));
  }

  public neq(value: OperandType): ILogicalPredicate {
    return new LogicalPredicate(new BinaryPredicateHolder(this, '<>', value));
  }

  public lt(value: OperandType): ILogicalPredicate {
    return new LogicalPredicate(new BinaryPredicateHolder(this, '<', value));
  }

  public lte(value: OperandType): ILogicalPredicate {
    return new LogicalPredicate(new BinaryPredicateHolder(this, '<=', value));
  }

  public gt(value: OperandType): ILogicalPredicate {
    return new LogicalPredicate(new BinaryPredicateHolder(this, '>', value));
  }

  public gte(value: OperandType): ILogicalPredicate {
    return new LogicalPredicate(new BinaryPredicateHolder(this, '>=', value));
  }

  public match(value: IBindableValue|RegExp|string): ILogicalPredicate {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  public between(lhs: ComparableValueType, rhs: ComparableValueType):
      ILogicalPredicate {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }

  // clang-format off
  public in(values: ComparableValueType[] | IBindableValue): ILogicalPredicate {
    // TODO(arthurhsu): implement
    throw new Error('NotImplemented');
  }
  // clang-format on

  public isNull(): ILogicalPredicate {
    return new LogicalPredicate(new UnaryPredicateHolder(this, 'is null'));
  }

  public isNotNull(): ILogicalPredicate {
    return new LogicalPredicate(new UnaryPredicateHolder(this, 'is null'));
  }
}
