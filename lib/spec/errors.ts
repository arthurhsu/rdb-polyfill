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

export class RDBError {
  private static error(type: string, msg?: string): Error {
    return new Error(type + msg ? `: ${msg}` : '');
  }

  static BlockingError(msg?: string): Error {
    return RDBError.error('BlockingError', msg);
  }

  static BindingError(msg?: string): Error {
    return RDBError.error('BindingError', msg);
  }

  static ConcurrencyError(msg?: string): Error {
    return RDBError.error('ConcurrencyError', msg);
  }

  static ConstraintError(msg?: string): Error {
    return RDBError.error('ConstraintError', msg);
  }

  static IntegrityError(msg?: string): Error {
    return RDBError.error('IntegrityError', msg);
  }

  static InvalidSchemaError(msg?: string): Error {
    return RDBError.error('InvalidSchemaError', msg);
  }

  static RuntimeError(msg?: string): Error {
    return RDBError.error('RuntimeError', msg);
  }

  static SyntaxError(msg?: string): Error {
    return RDBError.error('SyntaxError', msg);
  }

  static TimeoutError(msg?: string): Error {
    return RDBError.error('TimeoutError', msg);
  }

  static TransactionStateError(msg?: string): Error {
    return RDBError.error('TransactionStateError', msg);
  }

  static TypeError(msg?: string): Error {
    return RDBError.error('TypeError', msg);
  }

  static UnsupportedError(msg?: string): Error {
    return RDBError.error('UnsupportedError', msg);
  }
}