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

import {Database, Statement} from 'sqlite3';

import {Resolver} from '../base/resolver';
import {TransactionResults} from '../spec/execution_context';

export class Stmt {
  private stmt: Statement;
  readonly select: boolean;
  readonly binder: boolean;
  public finalized: boolean;
  private boundValues: Array<any>[];

  constructor(readonly db: Database, readonly sql: string,
              readonly hasResults: boolean, readonly needBinding: boolean) {
    this.finalized = false;
    this.select = sql.startsWith('select ');
    this.stmt = this.needBinding ? this.db.prepare(sql) : null;
    this.boundValues = [];
  }

  public all(): Promise<TransactionResults> {
    if (!this.select || this.finalized || !this.hasResults) {
      throw new Error('FIXME: InternalError');
    }

    let resolver = new Resolver<TransactionResults>();
    let handler = (err: Error, rows: any[]) => {
      if (err) {
        console.error('ERROR:', this.sql, err.message);
        resolver.reject(err);
      } else {
        resolver.resolve(rows.length ? rows as Object[] : undefined);
      }
    };

    if (!this.needBinding) {
      this.db.all(this.sql, handler);
    } else {
      if (this.boundValues.length != 1) {
        // Only allow one binding per select run
        throw new Error('BindingError');
      }
      this.stmt.all(this.boundValues[0], handler);
      this.stmt.finalize();
    }
    this.finalized = true;
    return resolver.promise;
  }

  public clone(): Stmt {
    return new Stmt(this.db, this.sql, this.hasResults, this.needBinding);
  }

  public bind(args: any|any[]): Stmt {
    if (!this.needBinding) {
      throw new Error('FIXME: InternalError');
    }

    this.boundValues.push(args);
    return this;
  }

  public run(): Promise<void> {
    if (this.select || this.finalized || this.hasResults) {
      throw new Error('FIXME: InternalError');
    }

    let resolver = new Resolver<void>();
    if (!this.needBinding) {
      this.db.run(this.sql, (err: Error) => {
        if (err) {
          console.error('ERROR:', this.sql, err.message);
          resolver.reject(err.message);
        } else {
          resolver.resolve();
        }
      });
    } else {
      // TODO(arthurhsu): this runner has stack limit
      let runner = () => {
        if (this.boundValues.length == 0) {
          resolver.resolve();
          return;
        }

        let binding = this.boundValues.shift();
        this.stmt.run(binding, (err: Error) => {
          if (err) {
            console.error('ERROR:', this.sql, err.message);
            resolver.reject(err.message);
          } else {
            runner();
          }
        });
      };
      runner();
    }
    return resolver.promise;
  }
}