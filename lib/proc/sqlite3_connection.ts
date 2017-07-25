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

import {Database} from 'sqlite3';

import {Sqlite3Context} from './sqlite3_context';
import {Resolver} from '../base/resolver';
import {BindableValueHolder} from '../schema/bindable_value_holder';
import {Schema} from '../schema/schema';
import {TableBuilder} from '../schema/table_builder';
import {TableSchema} from '../schema/table_schema';
import {IBindableValue} from '../spec/bindable_value';
import {IColumn} from '../spec/column';
import {DatabaseConnection} from '../spec/database_connection';
import {ObserverCallback} from '../spec/database_observer';
import {IDatabaseSchema} from '../spec/database_schema';
import {IDeleteQuery} from '../spec/delete_query';
import {TransactionMode} from '../spec/enums';
import {RDBError} from '../spec/errors';
import {IExecutionContext} from '../spec/execution_context';
import {IInsertQuery} from '../spec/insert_query';
import {ISelectQuery} from '../spec/select_query';
import {ITable} from '../spec/table';
import {ITableBuilder} from '../spec/table_builder';
import {ITableChanger} from '../spec/table_changer';
import {ITransaction} from '../spec/transaction';
import {IUpdateQuery} from '../spec/update_query';
import {DeleteQueryBuilder} from './delete_query_builder';
import {InsertQueryBuilder} from './insert_query_builder';
import {SelectQueryBuilder} from './select_query_builder';
import {Tx} from './tx';
import {UpdateQueryBuilder} from './update_query_builder';

/* tslint:disable */
const sqlite3NodeWrapper = require('sqlite3');
/* tslint:enable */

export const sqlite3 = sqlite3NodeWrapper.verbose();

export class Sqlite3Connection implements DatabaseConnection {
  static NUM_SPECIAL_TABLE: number = 4;
  readonly supportTransactionalSchemaChange = true;
  private db: Database;
  private dbSchema: Schema;

  constructor(
      readonly name: string, readonly filePath: string,
      readonly readOnly = false) {
    let mode = this.readOnly ? sqlite3.OPEN_READONLY : undefined;
    this.db = new sqlite3.Database(this.filePath, mode);
//    this.db.on('trace', (sql) => { console.log(`running ${sql}`); });
//    this.db.on('profile', (sql) => { console.log(`done ${sql}`); });
    this.dbSchema = null;
  }

  public getNativeDb(): Database {
    return this.db;
  }

  public simpleGet(sql: string): Promise<Object[]> {
    if (this.db === null) {
      throw RDBError.RuntimeError('FIXME: invalid state');
    }

    let resolver = new Resolver<Object[]>();
    this.db.all(sql, [], (err: Error, rows: any[]) => {
      if (err) {
        console.error('ERROR:', sql, err.message);
        resolver.reject(err);
      } else {
        resolver.resolve(rows.length ? rows as Object[] : undefined);
      }
    });
    return resolver.promise;
  }

  // Sequentially run the SQL statements given. Can only run non-select SQLs.
  public simpleRun(sqls: string[]): Promise<void> {
    let resolver = new Resolver<void>();

    let index = 0;
    let runner = () => {
      if (index == sqls.length) {
        resolver.resolve();
        return;
      }
      let sql = sqls[index];
      let res = new Resolver<void>();
      this.db.exec(sql, (err: Error) => {
        if (err) {
          console.error('ERROR:', sql, err.message);
          res.reject(err);
        } else {
          res.resolve();
        }
      });
      res.promise.then(() => {
        index++;
        runner();
      }, (e) => resolver.reject(e));
    };

    runner();
    return resolver.promise;
  }

  private getVersion(): Promise<number> {
    return this
        .simpleGet(
            `select version from "$rdb_version" where name="${this.name}"`)
        .then(results => {
          return results[0]['version'] || 0;
        });
  }

  private constructTable(tableName: string): Promise<TableSchema> {
    let tableSchema = new TableSchema(tableName);
    return this
        .simpleGet(
            'select name, type, nnull from "$rdb_column" where ' +
            `tbl="${tableName}" and db="${this.dbSchema.name}";`)
        .then(
            (rows: Object[]) => {
              rows.forEach(row => tableSchema.column(
                  row['name'], row['type'], row['nnull'] === 1));
              return tableSchema;
            },
            (e) => {
              return Promise.reject(e);
            });
  }

  private constructRelations(): Promise<void> {
    let promises: Promise<void>[] = [];
    this.dbSchema.listTables().forEach(tableName => {
      let promise =
          this.simpleGet(
                  'select * from "$rdb_relation" where' +
                  ` tbl="${tableName}" and db=${this.dbSchema.name}`)
              .then((rows: Object[]) => {
                if (rows) {
                  let tableSchema =
                      this.dbSchema.table(tableName) as any as TableSchema;
                  rows.forEach(row => {
                    switch (row['type']) {
                      case 'pk':
                        tableSchema._primaryKey = row['columns'].split(',');
                        if (row['attr'] == 'autoInc') {
                          tableSchema._autoIncrement = true;
                        }
                        break;

                      case 'fk':
                        tableSchema._foreignKey.push(
                            JSON.parse(row['columns'].replace(/\'/g, '"')));
                        break;

                      case 'index':
                        tableSchema._indices.push({
                          name: row['name'],
                          column:
                              JSON.parse(row['columns'].replace(/\'/g, '"')),
                          unique: row['attr'] == 'unique'
                        });
                        break;

                      default:
                        throw RDBError.RuntimeError('UnknownError');
                    }
                  });
                }
              });
      promises.push(promise);
    });
    return Promise.all(promises).then(() => {});
  }

  private scanSchema(): Promise<void> {
    let resolver = new Resolver<void>();

    this.simpleGet(
            `select name from "$rdb_table" where db="${this.dbSchema.name}"`)
        .then((rows: Object[]) => {
          if (rows === undefined || rows === null || rows.length == 0) {
            // The schema is empty
            resolver.resolve();
          } else {
            let tableNames = rows.map(row => row['name']);
            let promises = new Array<Promise<TableSchema>>(tableNames.length);
            // Must construct all tables and columns before adding relations.
            tableNames.forEach(tableName => {
              let promise = this.constructTable(tableName);
              promise.then(tableSchema => {
                this.dbSchema.reportTableChange(tableName, tableSchema);
              });
              promises.push(promise);
            });
            Promise.all(promises)
                .then(() => {
                  return this.constructRelations();
                })
                .then(() => {
                  resolver.resolve();
                });
          }
        });
    return resolver.promise;
  }

  private createInternalTables(): Promise<void> {
    return this.simpleRun([
      'create table "$rdb_version" (name text, version integer)',
      `insert into "$rdb_version" values ("${this.dbSchema.name}", 0)`,
      'create table "$rdb_table" (name text, db text, primary key(name, db))',
      'create table "$rdb_column" (name text, db text, tbl text, type text,' +
          ' nnull integer, primary key(name, tbl, db))',
      'create table "$rdb_relation" (name text, db text, tbl text,' +
          ' type text, columns text, ref text, attr text,' +
          ' primary key(name, tbl, db))'
    ]);
  }

  public init(): Promise<DatabaseConnection> {
    const QUERY_TABLE = 'select name from sqlite_master where type="table";';
    let specialTables: string[];
    return this.simpleGet(QUERY_TABLE)
        .then((rows: Object[]) => {
          let tableNames = rows ? rows.map(row => row['name']) : [];
          if (tableNames) {
            specialTables =
                tableNames.filter(value => value.startsWith('$rdb_'));
            if (specialTables.length != 0 &&
                specialTables.length != Sqlite3Connection.NUM_SPECIAL_TABLE) {
              throw RDBError.DataError('corrupted database');
            }
          }
          return specialTables.length ? this.getVersion() : Promise.resolve(0);
        })
        .then(version => {
          this.dbSchema = new Schema(this.name, version);
          if (specialTables.length) {
            return this.scanSchema();
          } else {
            // Volatile or new database
            return this.createInternalTables();
          }
        })
        .then(() => {
          return this;
        });
  }

  public createTransaction(mode?: TransactionMode): ITransaction {
    return new Tx(this, mode || 'readwrite' as TransactionMode);
  }

  public close(): Promise<Error> {
    let resolver = new Resolver<Error>();
    if (this.db === null) {
      resolver.resolve();
      this.db = null;
    } else {
      this.db.close(err => {
        resolver.resolve(err);
        this.db = null;
      });
    }
    return resolver.promise;
  }

  public bind(index: number): IBindableValue {
    return new BindableValueHolder(index);
  }

  public select(...columns: IColumn[]): ISelectQuery {
    return new SelectQueryBuilder(this, this.dbSchema, columns);
  }

  public insert(): IInsertQuery {
    return new InsertQueryBuilder(this, this.dbSchema, false);
  }

  public insertOrReplace(): IInsertQuery {
    return new InsertQueryBuilder(this, this.dbSchema, true);
  }

  public update(table: ITable): IUpdateQuery {
    return new UpdateQueryBuilder(this, this.dbSchema, table);
  }

  public delete(): IDeleteQuery {
    return new DeleteQueryBuilder(this, this.dbSchema);
  }

  public setVersion(version: number): IExecutionContext {
    throw RDBError.RuntimeError('NotImplemented');
  }

  public setForeignKeyCheck(value: boolean): IExecutionContext {
    throw RDBError.RuntimeError('NotImplemented');
  }

  public schema(): IDatabaseSchema {
    // TODO(arthurhsu): this object should not be mutable.
    return this.dbSchema;
  }

  public createTable(name: string): ITableBuilder {
    return new TableBuilder(this, name, this.dbSchema.name);
  }

  public alterTable(name: string): ITableChanger {
    throw RDBError.RuntimeError('NotImplemented');
  }

  public dropTable(name: string): IExecutionContext {
    throw RDBError.RuntimeError('NotImplemented');
  }

  public observe(query: ISelectQuery, callbackFn: ObserverCallback): string {
    throw RDBError.RuntimeError('NotImplemented');
  }

  public unobserve(observerKey: string): void {
    throw RDBError.RuntimeError('NotImplemented');
  }

  public getImplicitContext(): Sqlite3Context {
    return new Sqlite3Context(true, this);
  }
}