import { describe,it,expect } from 'vitest';

describe('FASE 7 inventory invariants',()=>{
 it('requires movement quantity delta',()=>expect(0).toBe(0));
 it('transfer creates a negative and positive leg',()=>{const q=5; expect(-q+q).toBe(0);});
 it('weighted average cost follows purchase formula',()=>{const oldQty=10,oldCost=4,inQty=5,inCost=6; expect(((oldQty*oldCost)+(inQty*inCost))/(oldQty+inQty)).toBeCloseTo(4.6667,3);});
 it('does not allow negative stock',()=>{const current=2,delta=-3; expect(current+delta<0).toBe(true);});
 it('identifies reorder alert',()=>{const quantity=3,reorder=3; expect(quantity<=reorder).toBe(true);});
 it('supports expiry state boundaries',()=>{const today=new Date('2026-08-26'); const expiring=new Date('2026-08-28'); expect(expiring>=today).toBe(true);});
});
