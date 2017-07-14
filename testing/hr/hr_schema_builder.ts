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
import {IExecutionContext, TransactionResults} from '../../lib/spec/execution_context';

export class HR {
  static createNewSchema(conn: DatabaseConnection): Promise<TransactionResults> {
    let tx = conn.createTransaction('readwrite');
    let queries: IExecutionContext[] = [];

    const STRING = 'string';
    const NUMBER = 'number';
    const DATE = 'date';

    queries.push(
        conn.createTable('Job')
            .column('id', STRING)
            .column('title', STRING)
            .column('minSalary', NUMBER)
            .column('maxSalary', NUMBER)
            .primaryKey('id')
            .index('idx_maxSalary', {name: 'maxSalary', order: 'desc'})
    );
    queries.push(
        conn.createTable('Region')
            .column('id', STRING)
            .column('name', STRING)
            .primaryKey('id')
    );
    queries.push(
        conn.createTable('Country')
            .column('id', NUMBER)
            .column('name', STRING)
            .column('regionId', STRING)
            .primaryKey('id', /* autoIncrement */ true)
            .foreignKey('fk_RegionId', 'regionId', 'Region.id')
    );
    queries.push(
        conn.createTable('Location')
            .column('id', STRING)
            .column('streetAddress', STRING)
            .column('postalCode', STRING)
            .column('city', STRING)
            .column('stateProvince', STRING)
            .column('countryId', NUMBER)
            .primaryKey('id')
            .foreignKey('fk_CountryId', 'countryId', 'Country.id')
    );
    queries.push(
        conn.createTable('Department')
            .column('id', STRING)
            .column('name', STRING)
            .column('managerId', STRING)
            .column('locationId', STRING)
            .primaryKey('id')
            .foreignKey('fk_LocationId', 'locationId', 'Location.id')
    );
    queries.push(
        conn.createTable('Employee')
            .column('id', STRING)
            .column('firstName', STRING, true)
            .column('lastName', STRING, true)
            .column('email', STRING, true)
            .column('phoneNumber', STRING, true)
            .column('hireDate', DATE)
            .column('jobId', STRING)
            .column('salary', NUMBER)
            .column('commissionPercent', NUMBER)
            .column('managerId', STRING)
            .column('departmentId', STRING)
            .column('photo', 'blob')
            .primaryKey('id')
            .foreignKey('fk_JobId', 'jobId', 'Job.id')
            .foreignKey('fk_DepartmentId', 'departmentId', 'Department.id')
            .index('ids_salary', {name: 'salary', order: 'desc'})
    );
    queries.push(
        conn.createTable('JobHistory')
            .column('employeeId', STRING)
            .column('startDate', DATE)
            .column('endDate', DATE)
            .column('jobId', STRING)
            .column('departmentId', STRING)
            .foreignKey('fk_EmployeeId', 'employeeId', 'Employee.id')
            .foreignKey('fk_DepartmentId', 'departmentId', 'Department.id')
    );
    queries.push(
        conn.createTable('Holiday')
            .column('name', STRING)
            .column('begin', DATE)
            .column('end', DATE)
            .primaryKey('name')
            .index('idx_begin', 'begin')
    );
    return tx.exec(queries);
  }
}
