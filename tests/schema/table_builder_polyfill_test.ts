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

import * as chai from 'chai';
import {TableBuilderPolyfill} from '../../lib/schema/table_builder_polyfill';
import {MockConnection} from '../../testing/mock_connection';

const assert = chai.assert;

describe('TableBuilderPolyfill', () => {
  let conn: MockConnection;
  before(() => conn = new MockConnection());

  it('throws_DuplicateColumn', () => {
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    assert.throws(() => {
      builder.column('number', 'number')
             .column('number', 'number');
    });
  });

  it('toSql_Simple', () => {
    const expected = 'create table foo (' +
                     'number real, ' +
                     'string text, ' +
                     'boolean integer, ' +
                     'date real, ' +
                     'object text not null, ' +
                     'blob blob' +
                     ')';
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    builder.column('number', 'number')
        .column('string', 'string')
        .column('boolean', 'boolean')
        .column('date', 'date')
        .column('object', 'object', true)
        .column('blob', 'blob');
    assert.equal(expected, builder.toSql());
  });

  it('toSql_singlePK', () => {
    const expected = 'create table foo (' +
                     'id real, ' +
                     'name text, ' +
                     'primary key (id)' +
                     ')';
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .primaryKey('id');
    assert.equal(expected, builder.toSql());
  });

  it('toSql_autoIncPK', () => {
    const expected = 'create table foo (' +
                     'id integer primary key autoincrement, ' +
                     'name text' +
                     ')';
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .primaryKey({'name': 'id', 'autoIncrement': true});
    assert.equal(expected, builder.toSql());
  });

  it('toSql_complexPK', () => {
    const expected = 'create table foo (' +
                     'id real, ' +
                     'name text, ' +
                     'primary key (id, name desc)' +
                     ')';
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .primaryKey(
            [{name: 'id', order: 'asc'}, {name: 'name', order: 'desc'}]);
    assert.equal(expected, builder.toSql());
  });

  it('toSql_simpleIndex', () => {
    const expected = 'create table foo (id real, name text); ' +
                     'create index idx on foo (id)';
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .index({name: 'idx', column: 'id'});
    assert.equal(expected, builder.toSql());
  });

  it('toSql_uniqueIndex', () => {
    const expected = 'create table foo (id real, name text); ' +
                     'create unique index idx on foo (id)';
    let builder = new TableBuilderPolyfill(conn, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .index({name: 'idx', column: 'id', unique: true});
    assert.equal(expected, builder.toSql());
  });
});
