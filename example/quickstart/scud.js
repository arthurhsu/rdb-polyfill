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

const navigator = require('../dist/rdb').navigator;

let db, table;
let payloads = [{'id': 1, 'name': 'what'}, {'id': 2, 'name': 'whom'}];
navigator.db
    .open('foo', {storageType: 'temporary'})
    .then((conn) => {
      db = conn;
      return db.createTable('foo')
                 .column('id', 'number')
                 .column('name', 'string')
                 .commit();
    }).then(() => {
      table = db.schema().table('foo');
      return db.insert().into(table).values(payloads).commit();
    }).then(() => {
      return db.select().from(table).where(table.id.eq(1)).commit();
    }).then(rows => {
      console.log('Result 1:', rows);
      return db.update(table).set(table.name, 'nono').commit();
    }).then(() => {
      return db.select(table.name).from(table).commit();
    }).then(rows => {
      console.log('Result 2:', rows);
      return db.delete().from(table).commit();
    }).then(() => {
      return db.select().from(table).commit();
    }).then(rows => {
      console.log('Demo ', rows.length == 0 ? 'SUCCESS' : 'FAIL');
      return db.close();
    }, (e) => {
      console.error(e);
      throw e;
    });
