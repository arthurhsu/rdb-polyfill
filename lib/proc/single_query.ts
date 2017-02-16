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

import {Schema} from '../schema/schema';
import {IQuery} from '../spec/query';
import {QueryBase} from './query_base';
import {SqlConnection} from './sql_connection';

export enum SingleQueryType {
  DropTable,
  Normal,
  SetVersion
}

export class SingleQuery extends QueryBase {
  public newVersion: number;
  public targetTable: string;

  constructor(
      connection: SqlConnection, readonly sql: string,
      readonly canRollback: boolean, readonly type: SingleQueryType) {
    super(connection, type !== SingleQueryType.Normal);
  }

  public explain(): Promise<string> {
    return Promise.resolve(this.sql);
  }

  public bind(...values: any[]): IQuery {
    throw new Error('UnsupportedError');
  }

  public clone(): IQuery {
    throw new Error('UnsupportedError');
  }

  public toSql(): string {
    return this.sql;
  }

  public createBinderMap() {
    // Do nothing.
  }

  public rollback(): Promise<void> {
    if (!this.canRollback) throw new Error('UnsupportedError');
    return super.rollback();
  }

  public onCommit(connection: SqlConnection): void {
    switch (this.type) {
      case SingleQueryType.DropTable:
        if (this.targetTable) {
          (connection.schema() as Schema)
              .reportTableChange(this.targetTable, null);
        }
        break;

      case SingleQueryType.SetVersion:
        if (this.newVersion !== undefined) {
          (connection.schema() as Schema).currentVersion = this.newVersion;
        }
        break;

      default:
        super.onCommit(connection);
        break;
    }
  }
}
