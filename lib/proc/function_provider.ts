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

import {NotPredicate} from '../pred/not_predicate';
import {AggregatedColumn} from '../schema/aggregated_column';
import {IColumn} from '../spec/column';
import {IDatabaseFunctionProvider} from '../spec/database_function_provider';
import {ILogicalPredicate} from '../spec/predicate';

export class FunctionProvider implements IDatabaseFunctionProvider {
  public not(predicate: ILogicalPredicate): ILogicalPredicate {
    return new NotPredicate(predicate);
  }

  private ensureNumericColumn(col: IColumn): void {
    if (col.type != 'number' && col.type != 'integer') {
      throw new Error('TypeError');
    }
  }

  private ensureComparableColumn(col: IColumn): void {
    if (col.type != 'integer' && col.type != 'number' && col.type != 'date' &&
        col.type != 'string') {
      throw new Error('TypeError');
    }
  }

  public avg(col: IColumn): IColumn {
    this.ensureNumericColumn(col);
    return new AggregatedColumn('avg', col.type, col);
  }

  public count(col?: IColumn): IColumn {
    if (col) {
      this.ensureNumericColumn(col);
    }
    return new AggregatedColumn('count', 'integer', col || null);
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

  public sum(col: IColumn): IColumn {
    this.ensureNumericColumn(col);
    return new AggregatedColumn('sum', col.type, col);
  }
}
