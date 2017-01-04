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

export class BindableValueHolder implements IBindableValue {
  private val: any;
  constructor(readonly index: number) {}

  public get value(): any {
    return this.val;
  }

  public bind(val: any): void {
    this.val = val;
  }

  public toString(): string {
    return (this.val === undefined) ? `?${this.index} ` :
                                      BindableValueHolder.format(this.val);
  }

  // ArrayBuffer to hex string.
  public static binToHex(buffer: ArrayBuffer|null): string|null {
    if (buffer == null) {
      return null;
    }

    const uint8Array = new Uint8Array(buffer);
    let s = '';
    for (let i = 0; i < uint8Array.length; ++i) {
      let chr = uint8Array[i].toString(16);
      s += chr.length < 2 ? '0' + chr : chr;
    }
    return s;
  }

  public static format(value: any): string {
    if (value instanceof Date) {
      return (value as Date).getTime().toString();
    }

    if (typeof(value) == 'boolean') {
      return value ? '1' : '0';
    }

    if (value instanceof ArrayBuffer) {
      return BindableValueHolder.binToHex(value);
    }

    if (typeof(value) == 'object') {
      return JSON.stringify(value);
    }

    return value.toString();
  }
}
