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

import * as chai from 'chai';
import {Sqlite3Database} from '../../lib/proc/sqlite3_database';
import {RDBStorageType} from '../../lib/spec/relational_database';

/* tslint:disable */
const fs = require('fs-extra');
const tmp = require('tmp');
/* tslint:enable */

const assert = chai.assert;

describe('Sqlite3Database', () => {
  it('openPersistent', () => {
    let filePath = tmp.tmpNameSync();
    let option = {
      storageType: 'persistent' as RDBStorageType,
      filePath: filePath
    };
    let db = new Sqlite3Database();
    return db.open('foo', option).then(conn => {
      assert.isTrue(fs.existsSync(filePath));
      return conn.close();
    }).then(() => {
      return db.open('foo', option);
    }).then(conn => {
      assert.isNotNull(conn);
      return conn.close();
    }).then(() => {
      fs.unlinkSync(filePath);
    });
  });

  it('openTemporary', () => {
    let filePath = tmp.tmpNameSync();
    let option = {
      storageType: 'temporary' as RDBStorageType,
      filePath: filePath
    };
    let db = new Sqlite3Database();
    return db.open('bar', option).then(conn => {
      assert.isNotNull(conn);
      assert.isFalse(fs.existsSync(filePath));
      return conn.close();
    });
  });

  it('drop', () => {
    let filePath = tmp.tmpNameSync();
    let option = {
      storageType: 'persistent' as RDBStorageType,
      filePath: filePath
    };
    let db = new Sqlite3Database();
    return db.open('foo', option).then(conn => {
      assert.isTrue(fs.existsSync(filePath));
      return conn.close();
    }).then(() => {
      return db.drop('foo');
    }).then(() => {
      assert.isFalse(fs.existsSync(filePath));
    });
  });
});