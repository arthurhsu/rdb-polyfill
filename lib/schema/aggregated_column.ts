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

export class AggregatedColumn extends Column {
  readonly name: string;
  readonly fullName: string;
  readonly nullable: boolean;

  constructor(readonly sql: string, readonly type: ColumnType,
              readonly column: IColumn|IColumn[],
              readonly alias: string = null) {
    super();
    if (column === null) {
      this.fullName = `${sql}(*)`;
      this.name = this.fullName;
    } else if (Array.isArray(column)) {  // must be distinct
      this.fullName = `${sql} ${column.map(v => v.fullName).join(', ')}`;
      this.name = `${sql} ${column.map(v => v.name).join(', ')}`;
    } else {
      this.fullName = `${sql}(${column.fullName})`;
      this.name = `${sql}(${column.name})`;
    }
    this.nullable = false;
  }

  public as(alias: string): IColumn {
    return new AggregatedColumn(this.sql, this.type, this.column, alias);
  }

  public eq(value: OperandType): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public neq(value: OperandType): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public lt(value: OperandType): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public lte(value: OperandType): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public gt(value: OperandType): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public gte(value: OperandType): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public match(value: IBindableValue|RegExp|string): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public between(lhs: ComparableValueType, rhs: ComparableValueType):
      ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  // clang-format off
  public in(values: ComparableValueType[] | IBindableValue): ILogicalPredicate {
    throw new Error('SyntaxError');
  }
  // clang-format on

  public isNull(): ILogicalPredicate {
    throw new Error('SyntaxError');
  }

  public isNotNull(): ILogicalPredicate {
    throw new Error('SyntaxError');
  }
}
