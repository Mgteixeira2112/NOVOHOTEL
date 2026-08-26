import { describe, expect, it } from 'node:test';
import { calculateAdr, calculateAverageTicket, calculateDifference, calculateOccupancy, calculateRevpar } from '../src/core/bi/metricFormulas';

describe('FASE 15 — fórmulas oficiais de BI', () => {
  it('calcula ocupação por room-night', () => expect(calculateOccupancy(8, 10)).toBe(0.8));
  it('não divide ocupação por zero', () => expect(calculateOccupancy(8, 0)).toBe(0));
  it('calcula ADR somente com quartos vendidos', () => expect(calculateAdr(1200, 6)).toBe(200));
  it('calcula RevPAR por quartos disponíveis', () => expect(calculateRevpar(1200, 10)).toBe(120));
  it('calcula ticket médio', () => expect(calculateAverageTicket(900, 6)).toBe(150));
  it('retorna zero para ticket sem pedidos', () => expect(calculateAverageTicket(900, 0)).toBe(0));
  it('calcula diferença para meta', () => expect(calculateDifference(82, 85)).toBe(-3));
  it('mantém moeda e receita separadas conceitualmente no contrato', () => {
    const roomRevenue = 1000;
    const posRevenue = 500;
    const totalRevenue = roomRevenue + posRevenue;
    expect(calculateAdr(roomRevenue, 5)).toBe(200);
    expect(totalRevenue).toBe(1500);
  });
});
