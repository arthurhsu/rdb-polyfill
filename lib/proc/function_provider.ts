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

import {AggregatedColumn} from '../schema/aggregated_column';
import {NotPredicate} from '../schema/not_predicate';
import {IColumn} from '../spec/column';
import {IDatabaseFunctionProvider} from '../spec/database_function_provider';
import {ILogicalPredicate} from '../spec/predicate';

export class FunctionProvider implements IDatabaseFunctionProvider {
  public not(predicate: ILogicalPredicate): ILogicalPredicate {
    return new NotPredicate(predicate);
  }

  private ensureNumericColumn(col: IColumn): void {
    if (col.type != 'number') {
      throw new Error('SyntaxError');
    }
  }

  private ensureComparableColumn(col: IColumn): void {
    if (col.type != 'number' && col.type != 'date' && col.type != 'string') {
      throw new Error('SyntaxError');
    }
  }

  public avg(col: IColumn): IColumn {
    this.ensureNumericColumn(col);
    return new AggregatedColumn('avg', 'number', col);
  }

  public count(col?: IColumn): IColumn {
    if (col) {
      this.ensureNumericColumn(col);
    }
    return new AggregatedColumn('count', 'number', col || null);
  }

  public distinct(...col: IColumn[]): IColumn {
    // TODO(arthurhsu): handle multi-column distinct
    let type = (col.length == 1) ? col[0].type : 'object';
    return new AggregatedColumn('distinct', type, col);
  }

  public min(col: IColumn): IColumn {
    this.ensureComparableColumn(col);
    return new AggregatedColumn('min', col.type, col);
  }

  public max(col: IColumn): IColumn {
    this.ensureComparableColumn(col);
    return new AggregatedColumn('max', col.type, col);
  }

  public stddev(col: IColumn): IColumn {
    // TODO(arthurhsu): by default SQLite3 does not support stddev/stdev
    this.ensureNumericColumn(col);
    return new AggregatedColumn('stddev', 'number', col);
  }

  public sum(col: IColumn): IColumn {
    // TODO(arthurhsu): in SQLite3 this should be total(x) instead of sum(x)
    this.ensureNumericColumn(col);
    return new AggregatedColumn('sum', 'number', col);
  }

  public var(col: IColumn): IColumn {
    // TODO(arthurhsu): by default SQLite3 does not support variance
    this.ensureNumericColumn(col);
    return new AggregatedColumn('variance', 'number', col);
  }
}
