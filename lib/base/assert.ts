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

export function assert(condition: boolean, message = 'assertion failed'): void {
  // Conditional compilation is enforced by gulp.
  /// #if DEBUG
  if (!condition) {
    throw new Error(message);
  }
  /// #endif
}

const NAME_CHECKER = /^[A-Za-z][A-Za-z0-9_]*$/;
export function validateName(name: string): boolean {
  return NAME_CHECKER.test(name);
}
