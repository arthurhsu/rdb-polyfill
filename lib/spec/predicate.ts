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
import {ComparableValueType} from './enums';

export type OperandType = ComparableValueType | IColumn;

export interface IComparisonPredicate {
  eq(value: OperandType): ILogicalPredicate;
  neq(value: OperandType): ILogicalPredicate;
  lt(value: OperandType): ILogicalPredicate;
  lte(value: OperandType): ILogicalPredicate;
  gt(value: OperandType): ILogicalPredicate;
  gte(value: OperandType): ILogicalPredicate;
}

export interface ITruthPredicate {
  match(value: IBindableValue|RegExp|string): ILogicalPredicate;
  between(lhs: ComparableValueType, rhs: ComparableValueType):
      ILogicalPredicate;
  in(values: ComparableValueType[]|IBindableValue): ILogicalPredicate;
  isNull(): ILogicalPredicate;
  isNotNull(): ILogicalPredicate;
}

export interface ILogicalPredicate {
  and(...values: ILogicalPredicate[]): ILogicalPredicate;
  or(...values: ILogicalPredicate[]): ILogicalPredicate;
  clone(): ILogicalPredicate;
}
