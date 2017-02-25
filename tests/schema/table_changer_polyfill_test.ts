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

import * as chai from 'chai';
import {TableChangerPolyfill} from '../../lib/schema/table_changer_polyfill';
import {MockConnection} from '../../testing/mock_connection';

const assert = chai.assert;

describe('TableChangerPolyfill', () => {
  let conn: MockConnection;
  before(() => conn = new MockConnection());

  it('rename', () => {
    let changer = new TableChangerPolyfill(conn, 'foo', 'db');
    const expected = 'alter table foo rename to bar';
    changer.rename('bar');
    assert.equal(expected, changer.toSql());
  });

  it('addColumn', () => {
    let changer = new TableChangerPolyfill(conn, 'foo', 'db');
    const expected =
        'alter table foo add column bar text not null default "baz"';
    changer.addColumn('bar', 'string', true, 'baz');
    assert.equal(expected, changer.toSql());
  });
});
