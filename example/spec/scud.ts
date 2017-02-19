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
import {TransactionResults} from '../../lib/spec/execution_context';

///// @@start
let dbConnection: DatabaseConnection;
let dept = dbConnection.schema().table('Dept');

export function insertData(): Promise<void> {
  let deptData = [
    {'id': 'HR', 'name': 'Human Resources', 'desc': 'Rock stars'},
    {'id': 'ENG', 'name': 'Engineering', 'desc': 'Hard workers'},
    {'id': 'NADA', 'name': 'Non existing'},
    {'id': 'L', 'name': 'Leadership'}
  ];
  return dbConnection.insert().into(dept).values(deptData).commit();
}

export function updateData(): Promise<void> {
  return dbConnection
      .update(dept)
      .set(dept['desc'], 'Master minds')
      .where(dept['id'].eq('L'))
      .commit();
}

export function deleteData(): Promise<void> {
  return dbConnection
      .delete()
      .from(dept)
      .where(dept['id'].eq('NADA'))
      .commit();
}

export function selectData(): Promise<TransactionResults> {
  return dbConnection.select().from(dept).commit();
}

insertData().then(function() {
  return updateData();
}).then(function() {
  return deleteData();
}).then(function() {
  return selectData();
}).then(function(rows) {
  // Expected returns:
  // [{'id': 'HR', 'name': 'Human Resources', 'desc': 'Rock stars'},
  //  {'id': 'ENG', 'name': 'Engineering', 'desc': 'Hard workers'},
  //  {'id': 'L', 'name': 'Leadership', 'desc': 'Master minds'}]
  console.log(rows);
});
///// @@end