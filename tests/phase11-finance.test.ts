import test from 'node:test';import assert from 'node:assert/strict';import {calculateCashDifference,classifyCashVariance,isOverdue} from '../src/services/financeService';
test('cash difference preserves shortage',()=>assert.equal(calculateCashDifference(100,90),-10));
test('cash difference preserves overage',()=>assert.deepEqual(classifyCashVariance(100,110),{difference:10,type:'OVERAGE'}));
test('cash shortage classification',()=>assert.deepEqual(classifyCashVariance(100,80),{difference:-20,type:'SHORTAGE'}));
test('overdue only applies to open receivable state',()=>{assert.equal(isOverdue('2020-01-01','OPEN',new Date('2026-01-01')),true);assert.equal(isOverdue('2020-01-01','PAID',new Date('2026-01-01')),false);});
