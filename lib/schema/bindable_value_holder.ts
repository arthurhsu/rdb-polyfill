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
import {RDBError} from '../spec/errors';

export class BindableValueHolder implements IBindableValue {
  constructor(readonly index: number) {
    if (!Number.isInteger(index) || index < 0) {
      throw RDBError.SyntaxError(
          'binder index must be positive short integer');
    }
  }

  public clone(): BindableValueHolder {
    let that = new BindableValueHolder(this.index);
    return that;
  }

  public toString(): string {
    return `?${this.index + 1}`;
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

  public static hexToBin(hex: string): ArrayBuffer {
    if (!hex || hex.length < 2) {
      return null;
    }

    if (hex.length % 2 != 0) {
      hex = '0' + hex;
    }
    let buffer = new ArrayBuffer(hex.length / 2);
    let uint8Array = new Uint8Array(buffer);
    for (let i = 0, j = 0; i < hex.length; i += 2) {
      uint8Array[j++] = parseInt(hex.substr(i, 2), 16);
    }
    return buffer;
  }

  public static format(value: any, prefix = '', postfix = ''): string {
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
      // TODO(arthurhsu): escape value.
      return `"${JSON.stringify(value)}"`;
    }

    if (typeof(value) == 'string') {
      // TODO(arthurhsu): escape value.
      return `"${prefix}${value}${postfix}"`;
    }
    return value.toString();
  }
}