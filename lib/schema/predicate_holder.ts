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

import {BindableValueHolder} from './bindable_value_holder';
import {OperandType} from '../spec/predicate';
import {ColumnSchema} from './column_schema';

export abstract class PredicateHolder {
  abstract toSql(): string;
  abstract createBinderMap(map: Map<number, BindableValueHolder>): void;

  static eval(value: OperandType): string {
    if (value instanceof ColumnSchema) {
      return (value as ColumnSchema).canonicalName;
    }

    if (value instanceof BindableValueHolder) {
      return value.toString();
    }

    return BindableValueHolder.format(value);
  };
}

export class UnaryPredicateHolder extends PredicateHolder {
  private sql: string;
  constructor(column: ColumnSchema, sql: string) {
    super();
    this.sql = `${column.canonicalName} ${sql}`;
  }

  public toSql(): string {
    return this.sql;
  }

  public createBinderMap(map: Map<number, BindableValueHolder>) {}
}

export class BinaryPredicateHolder extends PredicateHolder {
  constructor(readonly column: ColumnSchema, readonly sql: string,
              readonly value: OperandType) {
    super();
  }

  public toSql(): string {
    return `${this.column.canonicalName} ${this.sql} ` +
           `${PredicateHolder.eval(this.value)}`;
  }

  public createBinderMap(map: Map<number, BindableValueHolder>) {
    if (this.value instanceof BindableValueHolder) {
      map.set(this.value.index, this.value);
    }
  }
}
