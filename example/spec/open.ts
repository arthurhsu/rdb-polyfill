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
import {IRelationalDatabase} from '../../lib/spec/relational_database';

///// @@start
// Open database named 'hr'.
// If the named instance does not exist, create an empty database instance.
// Otherwise, open the existing database named 'hr'.
let dbConnection: DatabaseConnection;

export function connect(): Promise<DatabaseConnection> {
  let rdb = navigator['db'] as IRelationalDatabase;
  return rdb.open('hr').then((connection: DatabaseConnection) => {
    dbConnection = connection;

    // version is a read-only number that is for reference only.
    if (dbConnection.schema().version == 0) {
      // This is an empty database.
      return createDB();
    } else if (dbConnection.schema().version < 2) {
      // Version is smaller than expected, perform upgrades.
      return upgradeDB();
    }

    return dbConnection;
  });
}

export function createDB(): Promise<DatabaseConnection> {
  let tx = dbConnection.createTransaction('readwrite');
  let q1 = dbConnection
      .createTable('Dept')
      .column(/* name */ 'id', /* type */ 'string', /* not null */ true)
      .column('name', 'string', true)
      .column('desc', 'string')
      .primaryKey('id');
  let q2 = dbConnection
      .createTable('Emp')
      .column('id', 'number', true)
      .column('name', 'string', true)
      .column('deptId', 'string', true)
      .column('title', 'string')
      .primaryKey('id')
      .index('idx_name', 'name', /* unique */ true)
      .index('idx_desc', {name: 'desc', order: 'desc'})
      .foreignKey({
        'name': 'fk_DeptId',
        'local': 'deptId',
        'remote': 'Dept.id',
        'action': 'restrict',
        'timing': 'immediate'
      });
  let q3 = dbConnection.setVersion(2);
  return tx.exec([q1, q2, q3]).then(() => { return dbConnection; });
}

export function upgradeDB(): Promise<DatabaseConnection> {
  return dbConnection
      .alterTable('Dept')
      .addColumn('desc', 'string')
      .addIndex('idx_desc', {name: 'desc', order: 'desc'})
      .commit()
      .then(() => { return dbConnection; });
}

connect().then(() => {
  // Real work starts here.
});

///// @@end
