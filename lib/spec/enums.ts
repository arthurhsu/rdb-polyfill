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

export type ColumnType =
    'blob' | 'boolean' | 'date' | 'number' | 'string' | 'object';

export type ValueType = ArrayBuffer | boolean | Date | number | string | Object;

export type IndexableValueType = boolean | Date | number | string;

export type Order = 'asc' | 'desc';

export type ComparableValueType = IndexableValueType | IBindableValue;

export type ForeignKeyAction = 'restrict' | 'cascade';

export type ForeignKeyTiming = 'deferrable' | 'immediate';
