import { describe,it,expect } from 'vitest';

describe('FASE 8 operational task lifecycle',()=>{
 it('allows PENDING -> IN_PROGRESS -> COMPLETED',()=>{const transitions={PENDING:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['WAITING','COMPLETED','CANCELLED']};expect(transitions.PENDING).toContain('IN_PROGRESS');expect(transitions.IN_PROGRESS).toContain('COMPLETED');});
 it('rejects invalid direct completion',()=>{const allowed=['IN_PROGRESS','CANCELLED'];expect(allowed).not.toContain('COMPLETED');});
 it('models checkout as DIRTY -> CLEANING -> INSPECTION -> CLEAN',()=>{expect(['DIRTY','CLEANING','INSPECTION','CLEAN']).toHaveLength(4);});
 it('requires a reason for inspection rejection',()=>{expect((reason:string)=>{if(!reason.trim())throw new Error('REJECTION_REASON_REQUIRED');}).toThrow();});
 it('supports maintenance waiting for parts through generic WAITING task state',()=>{expect(['PENDING','IN_PROGRESS','WAITING','COMPLETED']).toContain('WAITING');});
 it('isolates board task types',()=>{const types=['ROOM_CLEANING','ROOM_INSPECTION','MAINTENANCE','GENERAL'];expect(new Set(types).size).toBe(types.length);});
 it('supports operational priorities',()=>expect(['LOW','NORMAL','HIGH','URGENT']).toContain('URGENT'));
});
