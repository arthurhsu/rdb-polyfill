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

import {DatabaseConnection} from '../../lib/spec/database_connection';

///// @@start
let dbConnection: DatabaseConnection;
let version = dbConnection.schema().version;

if (version < 2) {
  // Need DB upgrade.
  let tx = dbConnection.createTransaction('readwrite');

  // BEGIN TRANSACTION equivalent in RDB.
  tx.begin().then(() => {
    return tx.attach(dbConnection.setVersion(2));
  }).then(() => {
    let q = dbConnection
        .createTable('NewTable')
        .column('id', 'string', true)
        .column('name', 'string', true);
    return tx.attach(q);
  }).then(() => {
    let q = dbConnection
        .alterTable('Emp')
        .addColumn('location', 'string', true, 'LAX')
        .setColumn('title').set('title', true)  // Change to NOT NULL
        .addIndex('idx_location', 'location');
    return tx.attach(q);
  }).then(() => {
    return tx.attach(dbConnection.dropTable('Foo'));
  }).then(() => {
    // COMMIT current transaction.
    return tx.commit();
  }).then(() => {
    // Schema change has finished, start work here.
  });
}
