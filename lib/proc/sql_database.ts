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
import {Implementation} from '../dep/implementation';
import {Schema} from '../schema/schema';
import {TableSchema} from '../schema/table_schema';
import {DatabaseConnection} from '../spec/database_connection';
import {IRelationalDatabase, OpenDatabaseOptions} from '../spec/relational_database';
import {FunctionProvider} from './function_provider';
import {NativeDB} from './native_db';
import {SqlConnection} from './sql_connection';

export class SqlDatabase implements IRelationalDatabase {
  readonly fn: FunctionProvider;

  static NUM_SPECIAL_TABLE: number = 4;

  constructor(readonly persistPath: string) {
    this.fn = new FunctionProvider();
  }

  public drop(name: string): Promise<void> {
    if (this.persistPath) {
      return Implementation.dropNativeDB(`${this.persistPath}/${name}`);
    }
    return Promise.resolve();
  }

  public open(name: string, opt?: OpenDatabaseOptions):
      Promise<DatabaseConnection> {
    let volatile = (opt && opt.storageType == 'temporary');
    if (this.persistPath === null || this.persistPath === undefined) {
      volatile = true;
    }

    // TODO(arthurhsu): we want to use URI-based in-memory database for volatile
    // databases, however, node-sqlite3 does not support that. Therefore we'll
    // need to use this buggy implementation of put everything on the temporary
    // database for now.
    let dbName = volatile ? ':memory:' : `${this.persistPath}/${name}`;

    let resolver = new Resolver<SqlConnection>();
    let db = Implementation.createNativeDB(dbName);
    this.turnOnFKCheck(db).then(() => {
      this.constructSchema(db, name).then(
          (schema: Schema) => {
            resolver.resolve(new SqlConnection(db, schema));
          },
          (e) => {
            resolver.reject(e);
          });
    });
    return resolver.promise;
  }

  private turnOnFKCheck(db: NativeDB): Promise<void> {
    return db.exec(db.toggleForeignKeyCheckSql(true));
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
          return results[0]['version'] || 0;
        });
  }

  private initializeSchema(db: NativeDB, schema: Schema): Promise<Schema> {
    let resolver = new Resolver<Schema>();

    db.run([
        'create table "$rdb_version" (name text, version integer)',
        `insert into "$rdb_version" values ("${schema.name}", 0)`,
        'create table "$rdb_table" (name text, db text, primary key(name, db))',
        'create table "$rdb_column" (name text, db text, tbl text, type text,' +
            ' primary key(name, tbl, db))',
        'create table "$rdb_relation" (name text, db text, tbl text,' +
            ' type text, columns text, ref text, attr text,' +
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

  private constructTable(db: NativeDB, dbName: string, tableName: string):
      Promise<TableSchema> {
    let tableSchema = new TableSchema(tableName);
    return db
        .get(
            'select name, type from "$rdb_column" where ' +
            `tbl="${tableName}" and db="${dbName}"`)
        .then(
            (rows: Object[]) => {
              rows.forEach(row => tableSchema.column(row['name'], row['type']));
              return tableSchema;
            },
            (e) => {
              return Promise.reject(e);
            });
  }

  private constructRelations(db: NativeDB, schema: Schema): Promise<Schema> {
    let promises: Promise<void>[] = [];
    schema.listTables().forEach(tableName => {
      let promise =
          db.get(
                'select * from "$rdb_relation" where' +
                ` tbl="${tableName}" and db=${schema.name}`)
            .then((rows: Object[]) => {
                if (rows) {
                  let tableSchema =
                      schema.table(tableName) as any as TableSchema;
                  rows.forEach(row => {
                    switch (row['type']) {
                      case 'pk':
                        tableSchema._primaryKey = row['columns'].split(',');
                        if (row['attr'] == 'autoInc') {
                          tableSchema._autoIncrement = true;
                        }
                        break;

                      case 'fk':
                        // TODO(arthurhsu): implement
                        break;

                      case 'index':
                        tableSchema._indices.push({
                          name: row['name'],
                          column: JSON.parse(row['columns'].replace(/\'/g, '"')),
                          unique: row['attr'] == 'unique'
                        });
                        break;

                      default:
                        throw new Error('UnknownError');
                    }
                  });
                }
              });
      promises.push(promise);
    });
    return Promise.all(promises).then(() => {
      return schema;
    });
  }

  private scanSchema(db: NativeDB, schema: Schema): Promise<Schema> {
    let resolver = new Resolver<Schema>();

    db.get(`select name from "$rdb_table" where db="${schema.name}"`)
        .then((rows: Object[]) => {
          if (rows === undefined || rows === null || rows.length == 0) {
            // The schema is empty
            resolver.resolve(schema);
          } else {
            let tableNames = rows.map(row => row['name']);
            let promises = new Array<Promise<TableSchema>>(tableNames.length);
            // Must construct all tables and columns before adding relations.
            tableNames.forEach(tableName => {
              let promise = this.constructTable(db, schema.name, tableName);
              promise.then(tableSchema => {
                schema.reportTableChange(tableName, tableSchema);
              });
              promises.push(promise);
            });
            Promise.all(promises)
                .then(() => {
                  return this.constructRelations(db, schema);
                })
                .then(() => {
                  resolver.resolve(schema);
                });
          }
        });
    return resolver.promise;
  }
}
