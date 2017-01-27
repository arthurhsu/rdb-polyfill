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

import {Resolver} from '../base/resolver';
import {createNativeDB} from '../dep/create_native_db';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {DatabaseConnection} from '../spec/database_connection';
import {IRelationalDatabase, OpenDatabaseOptions} from '../spec/relational_database';
import {FunctionProvider} from './function_provider';
import {NativeDB} from './native_db';
import {SqlConnection} from './sql_connection';

export class SqlDatabase implements IRelationalDatabase {
  readonly fn: FunctionProvider;
  private givenName: string;
  private dbName: string;
  private dbOptions: OpenDatabaseOptions;

  static NUM_SPECIAL_TABLE: number = 3;

  constructor(readonly persistPath: string) {
    this.fn = new FunctionProvider();
  }

  public open(name: string, opt?: OpenDatabaseOptions):
      Promise<DatabaseConnection> {
    this.dbOptions = opt;
    this.givenName = name;
    return this.reopen();
  }

  public drop(name: string): Promise<void> {
    return Promise.reject('Not implemented');
  }

  public clone(): SqlDatabase {
    let that = new SqlDatabase(this.persistPath);
    that.dbOptions = this.dbOptions;
    that.givenName = this.givenName;
    return that;
  }

  public reopen(): Promise<SqlConnection> {
    if (!this.givenName) {
      throw new Error('Invalid reopen request');
    }

    let volatile =
        (this.dbOptions && this.dbOptions.storageType == 'temporary');
    // TODO(arthurhsu): we want to use URI-based in-memory database for volatile
    // databases, however, node-sqlite3 does not support that. Therefore we'll
    // need to use this buggy implementation of put everything on the temporary
    // database for now.
    this.dbName = volatile ? '' : `${this.persistPath}/${this.givenName}`;

    let resolver = new Resolver<SqlConnection>();
    let db = createNativeDB(this.dbName);
    this.constructSchema(db, this.givenName)
        .then(
            (schema: Schema) => {
              resolver.resolve(new SqlConnection(db, schema));
            },
            (e) => {
              resolver.reject(e);
            });
    return resolver.promise;
  }

  private constructSchema(db: NativeDB, name: string): Promise<Schema> {
    let specialTables: string[];
    return db.get('select name from sqlite_master where type="table"')
        .then((rows: Object[]) => {
          let tableNames = rows ? rows.map(row => row['name']) : [];
          specialTables = tableNames.filter(value => value.startsWith('$rdb_'));
          if (specialTables.length != 0 &&
              specialTables.length != SqlDatabase.NUM_SPECIAL_TABLE) {
            throw new Error('DataError: corrupted database');
          }

          return specialTables.length ? this.getVersion(db, name) :
                                        Promise.resolve(0);
        })
        .then(version => {
          let schema = new Schema(name, version);
          if (specialTables.length) {
            return this.scanSchema(db, schema);
          } else {
            // Volatile or new database
            return this.initializeSchema(db, schema);
          }
        });
  }

  private getVersion(db: NativeDB, name: string): Promise<number> {
    return db.get(`select version from "$rdb_version" where name="${name}"`)
        .then(results => {
          return results['version'] || 0;
        });
  }

  private initializeSchema(db: NativeDB, schema: Schema): Promise<Schema> {
    let resolver = new Resolver<Schema>();

    db.run([
        'create table "$rdb_version" (name text, version integer)',
        `insert into "$rdb_version" values ("${schema.name}", 0)`,
        'create table "$rdb_table" (name text, db text, primary key(name, db))',
        'create table "$rdb_column" (name text, db text, tbl text, type text,' +
            ' primary key(name, tbl, db))'
      ])
        .then(
            () => {
              resolver.resolve(schema);
            },
            (e) => {
              resolver.reject(e);
            });
    return resolver.promise;
  }

  private scanSchema(db: NativeDB, schema: Schema): Promise<Schema> {
    let resolver = new Resolver<Schema>();
    let change = new Map<string, TableSchema>();

    db.get(`select name from "$rdb_table" where db="${schema.name}"`)
        .then((rows: Object[]) => {
          let tableNames = rows.map(row => row['name']);
          let promises = new Array<Promise<void>>(tableNames.length);
          tableNames.forEach(tableName => {
            let promise =
                db.get(
                      'select name, type from "$rdb_column"' +
                      ` where tbl="${tableName}" and db="${schema.name}"`)
                    .then(
                        (rows: Object[]) => {
                          let tableSchema = new TableSchema(tableName);
                          rows.forEach(
                              row =>
                                  tableSchema.column(row['name'], row['type']));
                          change.set(tableName, tableSchema);
                        },
                        (e) => {
                          resolver.reject(e);
                        });
            promises.push(promise);
          });
          Promise.all(promises).then(() => {
            schema.reportChange(change);
            resolver.resolve(schema);
          });
        });
    return resolver.promise;
  }
}
