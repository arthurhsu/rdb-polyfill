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

import {IDatabaseFunctionProvider} from '../spec/database_function_provider';
import {IColumn} from '../spec/column';
import {ILogicalPredicate} from '../spec/predicate';

export class FunctionProvider implements IDatabaseFunctionProvider {
  public not(predicate: ILogicalPredicate): ILogicalPredicate {
    throw new Error('NotImplemented');
  }

  public avg(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public count(col?: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public distinct(...col: IColumn[]): IColumn {
    throw new Error('NotImplemented');
  }

  public geomean(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public min(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public max(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public stddev(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public sum(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }

  public var(col: IColumn): IColumn {
    throw new Error('NotImplemented');
  }
}