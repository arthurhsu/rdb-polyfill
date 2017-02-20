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

export function getOrderList(): Promise<TransactionResults> {
  let order = dbConnection.schema().table('Order');
  let archive = dbConnection.schema().table('ArchivedOrder');

  return dbConnection
      .select(order['item'], order['amount'])
      .from(order)
      .where(order['category'].eq('Clothing'))
      .union(dbConnection
          .select(archive['item'], archive['amount'])
          .from(archive)
          .where(archive.category.eq('Clothing')))
      .commit();
}
///// @@end
