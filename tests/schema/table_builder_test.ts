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
import {TableBuilder} from '../../lib/schema/table_builder';

const assert = chai.assert;

describe('TableBuilder', () => {
  it('throws_DuplicateColumn', () => {
    let builder = new TableBuilder(null, 'foo', 'db');
    assert.throws(() => {
      builder.column('number', 'number')
             .column('number', 'number');
    });
  });

  it('tableBuilder_toSql_Simple', () => {
    const expected = 'create table foo (' +
                     'integer integer, ' +
                     'number real, ' +
                     'string text, ' +
                     'boolean integer, ' +
                     'date integer, ' +
                     'object text not null, ' +
                     'blob blob' +
                     ');';
    let builder = new TableBuilder(null, 'foo', 'db');
    builder
        .column('integer', 'integer')
        .column('number', 'number')
        .column('string', 'string')
        .column('boolean', 'boolean')
        .column('date', 'date')
        .column('object', 'object', true)
        .column('blob', 'blob');
    assert.equal(expected, builder.toSql()[0]);
  });

  it('tableBuilder_toSql_singlePK', () => {
    const expected = 'create table foo (' +
                     'id integer, ' +
                     'name text, ' +
                     'primary key (id)' +
                     ');';
    let builder = new TableBuilder(null, 'foo', 'db');
    builder.column('id', 'integer')
        .column('name', 'string')
        .primaryKey('id');
    assert.equal(expected, builder.toSql()[0]);
  });

  it('tableBuilder_toSql_autoIncPK', () => {
    const expected = 'create table foo (' +
                     'id integer primary key autoincrement, ' +
                     'name text' +
                     ');';
    let builder = new TableBuilder(null, 'foo', 'db');
    builder.column('id', 'integer')
        .column('name', 'string')
        .primaryKey('id', true);
    assert.equal(expected, builder.toSql()[0]);
  });

  it('tableBuilder_toSql_complexPK', () => {
    const expected = 'create table foo (' +
                     'id real, ' +
                     'name text, ' +
                     'primary key (id, name)' +
                     ');';
    let builder = new TableBuilder(null, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .primaryKey(['id', 'name']);
    assert.equal(expected, builder.toSql()[0]);
  });

  it('tableBuilder_toSql_simpleIndex', () => {
    const expected = [
      'create table foo (id real, name text);',
      'create index idx on foo (id);'
    ];
    let builder = new TableBuilder(null, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .index('idx', 'id');
    assert.deepEqual(expected, builder.toSql());
  });

  it('tableBuilder_toSql_uniqueIndex', () => {
    const expected = [
      'create table foo (id real, name text);',
      'create unique index idx on foo (id);'
    ];
    let builder = new TableBuilder(null, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .index('idx', 'id', true);
    assert.deepEqual(expected, builder.toSql());
  });

  it('tableBuilder_toSql_singleFK', () => {
    const expected = 'create table foo (id real, name text, ' +
                     'constraint fk_id foreign key (id) references bar(id) ' +
                     'on update cascade on delete cascade deferrable);';
    let builder = new TableBuilder(null, 'foo', 'db');
    builder.column('id', 'number')
        .column('name', 'string')
        .foreignKey('fk_id', 'id', 'bar.id', 'cascade', 'deferrable');
    assert.equal(expected, builder.toSql()[0]);
  });

  it('tableBuilder_toSql_multiFK', () => {
    const expected =
        'create table playlist (sid text, aid text, author text, title text, ' +
        'constraint fk_album foreign key (aid, author) ' +
        'references album(id, author), ' +
        'constraint fk_song foreign key (sid, title) ' +
        'references song(id, title));';
    let builder = new TableBuilder(null, 'playlist', 'db');
    builder.column('sid', 'string')
        .column('aid', 'string')
        .column('author', 'string')
        .column('title', 'string')
        .foreignKey('fk_album', ['aid', 'author'], ['album.id', 'album.author'])
        .foreignKey('fk_song', ['sid', 'title'], ['song.id', 'song.title']);
    assert.equal(expected, builder.toSql()[0]);
  });
});
