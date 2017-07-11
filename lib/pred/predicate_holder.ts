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
import {ColumnSchema} from '../schema/column_schema';
import {IBindableValue} from '../spec/bindable_value';
import {ComparableValueType} from '../spec/enums';
import {OperandType} from '../spec/predicate';
import {ISelectQuery} from '../spec/select_query';

export abstract class PredicateHolder {
  abstract toSql(): string;

  static eval(value: OperandType, prefix = '', postfix = ''): string {
    if (value instanceof ColumnSchema) {
      return (value as ColumnSchema).fullName;
    }

    if (value instanceof BindableValueHolder) {
      return value.toString();
    }

    return BindableValueHolder.format(value, prefix, postfix);
  };
}

export class UnaryPredicateHolder extends PredicateHolder {
  private sql: string;
  constructor(column: ColumnSchema, sql: string) {
    super();
    this.sql = `${column.fullName} ${sql}`;
  }

  public toSql(): string {
    return this.sql;
  }
}

export class BinaryPredicateHolder extends PredicateHolder {
  constructor(
      readonly column: ColumnSchema, readonly sql: string,
      readonly value: OperandType, readonly prefix = '',
      readonly postfix = '') {
    super();
  }

  public toSql(): string {
    return `${this.column.fullName} ${this.sql} ` +
        `${PredicateHolder.eval(this.value, this.prefix, this.postfix)}`;
  }
}

export class TernaryPredicateHolder extends PredicateHolder {
  constructor(
      readonly column: ColumnSchema, readonly sql: string,
      readonly prep: string, readonly lhs: OperandType,
      readonly rhs: OperandType) {
    super();
  }

  public toSql(): string {
    return `${this.column.fullName} ${this.sql} ` +
        `${PredicateHolder.eval(this.lhs)} ${this.prep} ` +
        `${PredicateHolder.eval(this.rhs)}`;
  }
}

export class InPredicateHolder extends PredicateHolder {
  private subquery: ISelectQuery;
  private values: ComparableValueType[]|IBindableValue;

  constructor(
      readonly column: ColumnSchema,
      values: ComparableValueType[]|IBindableValue|ISelectQuery) {
    super();

    // Type guard function
    let isSubQuery = (arg: any): arg is ISelectQuery => {
      return arg.from != undefined;
    };
    this.subquery = isSubQuery(values) ? values : null;
    this.values = (this.subquery === null) ?
        (values as ComparableValueType[] | IBindableValue) :
        null;
  }

  public toSql(): string {
    let rhs: string;
    if (this.subquery) {
      rhs = this.subquery.toSql()[0];
    } else if (this.values instanceof BindableValueHolder) {
      rhs = this.values.toString();
    } else {
      let values = this.values as ComparableValueType[];
      rhs = values.map(v => PredicateHolder.eval(v)).join(', ');
    }
    return `${this.column.fullName} in (${rhs})`;
  }
}
