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
import {LogicalPredicate} from '../../lib/pred/logical_predicate';
import {NotPredicate} from '../../lib/pred/not_predicate';
import {BinaryPredicateHolder, UnaryPredicateHolder} from '../../lib/pred/predicate_holder';
import {ColumnSchema} from '../../lib/schema/column_schema';

const assert = chai.assert;

describe('LogicalPredicate', () => {
  it('toSql_twoAnds', () => {
    let col1 = new ColumnSchema('foo', 'id', 'string', false);
    let col2 = new ColumnSchema('foo', 'ts', 'date', false);
    let col3 = new ColumnSchema('foo', 'pic', 'blob', true);
    let binaryOp1 = new BinaryPredicateHolder(col1, '=', 1);
    let binaryOp2 = new BinaryPredicateHolder(col2, '>', 300);
    let unaryOp = new UnaryPredicateHolder(col3, 'is not null');
    let pred = new LogicalPredicate(binaryOp1);
    pred.and(new LogicalPredicate(binaryOp2), new LogicalPredicate(unaryOp));
    let expected = '(foo.id = 1) and (foo.ts > 300) and (foo.pic is not null)';
    assert.equal(expected, pred.toSql());
    assert.equal(expected, pred.clone().toSql());
  });

  it('toSql_notAndOr', () => {
    let col1 = new ColumnSchema('foo', 'id', 'string', false);
    let col2 = new ColumnSchema('foo', 'ts', 'date', false);
    let col3 = new ColumnSchema('foo', 'pic', 'blob', true);
    let binaryOp1 = new BinaryPredicateHolder(col1, '=', 1);
    let binaryOp2 = new BinaryPredicateHolder(col2, '>', 300);
    let unaryOp = new UnaryPredicateHolder(col3, 'is not null');
    let pred = new LogicalPredicate(binaryOp1);
    pred.and(new LogicalPredicate(binaryOp2));
    pred.or(new LogicalPredicate(unaryOp));
    let pred2 = new NotPredicate(pred);
    let expected =
        'not (((foo.id = 1) and (foo.ts > 300)) or (foo.pic is not null))';
    assert.equal(expected, pred2.toSql());
    assert.equal(expected, pred2.clone().toSql());
  });
});
