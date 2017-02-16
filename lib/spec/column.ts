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
import {ColumnType, ComparableValueType} from './enums';
import {IComparisonPredicate, ILogicalPredicate, ITruthPredicate, OperandType} from './predicate';

export interface IColumn {
  readonly name: string;
  readonly table: string;
  readonly type: ColumnType;
  readonly fullName: string;
  readonly nullable: boolean;
  as(alias: string): IColumn;
}

export abstract class Column implements IColumn, IComparisonPredicate,
                                        ITruthPredicate {
  public abstract get name(): string;
  public abstract get table(): string;
  public abstract get type(): ColumnType;
  public abstract get fullName(): string;
  public abstract get nullable(): boolean;
  public abstract as(alias: string): IColumn;

  public abstract eq(value: OperandType): ILogicalPredicate;
  public abstract neq(value: OperandType): ILogicalPredicate;
  public abstract lt(value: OperandType): ILogicalPredicate;
  public abstract lte(value: OperandType): ILogicalPredicate;
  public abstract gt(value: OperandType): ILogicalPredicate;
  public abstract gte(value: OperandType): ILogicalPredicate;

  public abstract match(value: IBindableValue|RegExp|string): ILogicalPredicate;
  public abstract between(lhs: ComparableValueType, rhs: ComparableValueType):
      ILogicalPredicate;
  // clang-format off
  public abstract in(
      values: ComparableValueType[] | IBindableValue): ILogicalPredicate;
  // clang-format on
  public abstract isNull(): ILogicalPredicate;
  public abstract isNotNull(): ILogicalPredicate;
}
