import test from 'node:test';
import assert from 'node:assert/strict';
import { addFolioItem, createFolioPayment, voidFolioItem } from '../src/services/folioService';

test('rejects invalid folio quantity before persistence',async()=>{await assert.rejects(()=>addFolioItem({folioId:'f',category:'FOOD',description:'x',quantity:0,unitPrice:10,source:'POS'}),/INVALID_FOLIO_AMOUNT/);});
test('rejects invalid payment before persistence',async()=>{await assert.rejects(()=>createFolioPayment({folioId:'f',amount:0,method:'PIX'}),/INVALID_PAYMENT_AMOUNT/);});
test('requires audit reason for folio void',async()=>{await assert.rejects(()=>voidFolioItem('i','   '),/VOID_REASON_REQUIRED/);});
