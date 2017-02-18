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
import {OperandType} from '../spec/predicate';

export abstract class PredicateHolder {
  abstract toSql(): string;
  abstract createBinderMap(map: Map<number, BindableValueHolder>): void;

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

  public createBinderMap(map: Map<number, BindableValueHolder>) {}
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

  public createBinderMap(map: Map<number, BindableValueHolder>) {
    if (this.value instanceof BindableValueHolder) {
      map.set(this.value.index, this.value);
    }
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

  public createBinderMap(map: Map<number, BindableValueHolder>) {
    [this.lhs, this.rhs].forEach(value => {
      if (value instanceof BindableValueHolder) {
        map.set(value.index, value);
      }
    });
  }
}
