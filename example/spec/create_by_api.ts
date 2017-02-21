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
let tx = dbConnection.createTransaction('readwrite');
let q1 = dbConnection
    .createTable('Dept')
    .column(/* name */ 'id', /* column_type */ 'string', /* not_null */ true)
    .column('name', 'string', true)
    .primaryKey('id');

let q2 = dbConnection
    .createTable('Emp')
    .column('id', 'number', true)
    .column('name', 'string', true)
    .column('deptId', 'string', true)
    .column('title', 'string')
    .primaryKey('id')
    .index('idx_Desc', {'name': 'desc', 'order': 'desc'})
    .foreignKey('fk_DeptId', 'deptId', 'Dept.id');

tx.exec([q1, q2]).then(() => {
  // Table created, do something here.
});
///// @@end
