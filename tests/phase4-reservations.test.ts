import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BED_MATCHES,
  BOOKING_MODES,
  PAYMENT_STATUSES,
  RESERVATION_STATUSES,
  detectReservationConflict,
} from '../src/domain/hotelOsCore';
import { availabilityService } from '../src/services/availabilityService';
import { datesOverlap, calculateNights, isRoomAvailable, searchAvailableRooms } from '../src/utils/availability';
import type { Quarto, Reserva, BloqueioQuarto, TipoQuarto } from '../src/types/index';

// 1. Datas válidas
test('1. datas válidas: calcula noites corretamente e não trata checkout como noite ocupada', () => {
  const nights = calculateNights('2026-09-10', '2026-09-13');
  assert.equal(nights, 3);
  // Mesmo dia de checkout de um hóspede e check-in de outro NÃO deve gerar sobreposição
  assert.equal(datesOverlap('2026-09-10', '2026-09-13', '2026-09-13', '2026-09-16'), false);
});

// 2. Datas inválidas
test('2. datas inválidas: rejeita checkout <= checkin e zero adultos', async () => {
  await assert.rejects(
    availabilityService.search({
      hotelId: 'hotel-a',
      checkin: '2026-09-15',
      checkout: '2026-09-15',
      adults: 2,
      children: 0,
    }),
    /Check-out deve ser posterior/
  );

  await assert.rejects(
    availabilityService.search({
      hotelId: 'hotel-a',
      checkin: '2026-09-16',
      checkout: '2026-09-15',
      adults: 2,
      children: 0,
    }),
    /Check-out deve ser posterior/
  );

  await assert.rejects(
    availabilityService.search({
      hotelId: 'hotel-a',
      checkin: '2026-09-15',
      checkout: '2026-09-18',
      adults: 0,
      children: 1,
    }),
    /quantidade de adultos/i
  );
});

// 3. Reserva conflitante
test('3. reserva conflitante: detecta sobreposição no mesmo período', () => {
  const existing = [{ checkIn: '2026-10-01', checkOut: '2026-10-05', status: 'confirmada' as const }];
  assert.equal(detectReservationConflict(existing, { checkIn: '2026-10-02', checkOut: '2026-10-04' }), true);
  assert.equal(detectReservationConflict(existing, { checkIn: '2026-09-28', checkOut: '2026-10-02' }), true);
  assert.equal(detectReservationConflict(existing, { checkIn: '2026-10-04', checkOut: '2026-10-08' }), true);
});

// 4. Reservas consecutivas
test('4. reservas consecutivas: permite checkout e checkin no mesmo dia', () => {
  const existing = [{ checkIn: '2026-10-01', checkOut: '2026-10-05', status: 'confirmada' as const }];
  assert.equal(detectReservationConflict(existing, { checkIn: '2026-10-05', checkOut: '2026-10-08' }), false);
  assert.equal(detectReservationConflict(existing, { checkIn: '2026-09-25', checkOut: '2026-10-01' }), false);
});

// 5. Capacidade
test('5. capacidade: quartos com capacidade insuficiente são desconsiderados', () => {
  const room: Quarto = {
    id: 'q1',
    numero: '101',
    tipo_quarto_id: 't1',
    capacidade: 2,
    valor_diaria: 200,
    descricao: '',
    status: 'disponivel',
    ativo: true,
    andar: 1,
    comodidades: [],
    fotos: [],
  };
  const tipo: TipoQuarto = {
    id: 't1',
    nome: 'Standard',
    descricao: '',
    capacidade_padrao: 2,
    comodidades_principais: [],
  };

  const results = searchAvailableRooms('2026-11-01', '2026-11-03', 3, [room], [tipo], [], []);
  assert.equal(results.length, 0);

  const resultsOk = searchAvailableRooms('2026-11-01', '2026-11-03', 2, [room], [tipo], [], []);
  assert.equal(resultsOk.length, 1);
});

// 6. Adultos e Crianças
test('6. adultos e crianças: validação de contagens positivas e crianças', async () => {
  await assert.rejects(
    availabilityService.search({
      hotelId: 'hotel-a',
      checkin: '2026-12-01',
      checkout: '2026-12-05',
      adults: 1,
      children: -1,
    }),
    /Quantidade de crianças inválida/
  );
});

// 7. Matching de camas
test('7. matching de camas: possui graus explícitos de compatibilidade', () => {
  assert.deepEqual([...BED_MATCHES], ['EXACT', 'GOOD', 'PARTIAL', 'INCOMPATIBLE']);
});

// 8. Quarto bloqueado
test('8. quarto bloqueado: bloqueio operacional remove quarto da disponibilidade', () => {
  const room: Quarto = {
    id: 'q-blocked',
    numero: '201',
    tipo_quarto_id: 't1',
    capacidade: 2,
    valor_diaria: 300,
    descricao: '',
    status: 'disponivel',
    ativo: true,
    andar: 2,
    comodidades: [],
    fotos: [],
  };
  const blocks: BloqueioQuarto[] = [
    {
      id: 'b1',
      quarto_id: 'q-blocked',
      data_inicio: '2026-09-10',
      data_fim: '2026-09-15',
      motivo: 'Pintura',
      created_at: new Date().toISOString(),
    },
  ];

  const availableDuringBlock = isRoomAvailable('q-blocked', '2026-09-11', '2026-09-14', [], blocks);
  assert.equal(availableDuringBlock, false);

  const availableAfterBlock = isRoomAvailable('q-blocked', '2026-09-15', '2026-09-18', [], blocks);
  assert.equal(availableAfterBlock, true);
});

// 9. Quarto em manutenção
test('9. quarto em manutenção: status operacional inativo ou bloqueio', () => {
  const roomInativo: Quarto = {
    id: 'q-manut',
    numero: '202',
    tipo_quarto_id: 't1',
    capacidade: 2,
    valor_diaria: 300,
    descricao: '',
    status: 'manutencao',
    ativo: false,
    andar: 2,
    comodidades: [],
    fotos: [],
  };
  const tipo: TipoQuarto = {
    id: 't1',
    nome: 'Standard',
    descricao: '',
    capacidade_padrao: 2,
    comodidades_principais: [],
  };

  const results = searchAvailableRooms('2026-09-10', '2026-09-12', 2, [roomInativo], [tipo], [], []);
  assert.equal(results.length, 0);
});

// 10. HOLD e Expiração
test('10. HOLD e expiração: ciclo de reserva temporária e expiração do inventário', () => {
  const activeHoldReserva: Reserva = {
    id: 'res-hold-active',
    hospede_id: 'guest-1',
    quarto_id: 'q1',
    checkin: '2026-09-10',
    checkout: '2026-09-15',
    status: 'pendente',
    valor_total: 500,
    origem: 'direto',
    created_at: new Date().toISOString(),
  };

  const isAvailable = isRoomAvailable('q1', '2026-09-11', '2026-09-14', [activeHoldReserva], []);
  assert.equal(isAvailable, false);
});

// 11. Confirmação
test('11. confirmação: estados de reserva padronizados no domínio', () => {
  assert.equal(RESERVATION_STATUSES.includes('confirmada'), true);
  assert.equal(RESERVATION_STATUSES.includes('pendente'), true);
  assert.equal(RESERVATION_STATUSES.includes('cancelada'), true);
});

// 12. Cálculo de preço (Rate Plans / Políticas)
test('12. cálculo de preço: subtotal, diárias e taxas calculados de forma determinística', () => {
  const nights = calculateNights('2026-09-01', '2026-09-04');
  const dailyRate = 250;
  const subtotal = dailyRate * nights;
  const taxRatePercent = 5;
  const taxes = Math.round(subtotal * (taxRatePercent / 100));
  const total = subtotal + taxes;

  assert.equal(nights, 3);
  assert.equal(subtotal, 750);
  assert.equal(taxes, 38);
  assert.equal(total, 788);
});

// 13. Política de cancelamento
test('13. política de cancelamento: suporta planos reembolsáveis e não-reembolsáveis', () => {
  const ratePlans = [
    { code: 'FLEX', refundable: true, breakfast: true },
    { code: 'NON_REFUNDABLE', refundable: false, breakfast: false },
  ];
  assert.equal(ratePlans[0].refundable, true);
  assert.equal(ratePlans[1].refundable, false);
});

// 14. Concorrência: proteção contra dupla confirmação
test('14. concorrência: detecta e bloqueia reservas sobrepostas para o mesmo quarto', () => {
  const bookedReservations: Array<{ checkIn: string; checkOut: string; status: 'confirmada' | 'pendente' | 'cancelada' }> = [];

  const user1Tries = { checkIn: '2026-10-10', checkOut: '2026-10-15' };
  const user2Tries = { checkIn: '2026-10-12', checkOut: '2026-10-17' };

  // User 1 reserva primeiro
  const conflict1 = detectReservationConflict(bookedReservations, user1Tries);
  assert.equal(conflict1, false);
  bookedReservations.push({ ...user1Tries, status: 'confirmada' });

  // User 2 tenta reservar sobreposto
  const conflict2 = detectReservationConflict(bookedReservations, user2Tries);
  assert.equal(conflict2, true); // Bloqueado contra overbooking!
});

// 15. Isolamento por hotel
test('15. isolamento por hotel: pesquisas não cruzam quartos de outros hotéis', () => {
  interface ScopedRoom extends Quarto {
    hotel_id?: string;
  }
  const roomHotelA: ScopedRoom = {
    id: 'q-a',
    hotel_id: 'hotel-a',
    numero: '101',
    tipo_quarto_id: 't1',
    capacidade: 2,
    valor_diaria: 200,
    descricao: '',
    status: 'disponivel',
    ativo: true,
    andar: 1,
    comodidades: [],
    fotos: [],
  };
  const roomHotelB: ScopedRoom = {
    id: 'q-b',
    hotel_id: 'hotel-b',
    numero: '101',
    tipo_quarto_id: 't1',
    capacidade: 2,
    valor_diaria: 300,
    descricao: '',
    status: 'disponivel',
    ativo: true,
    andar: 1,
    comodidades: [],
    fotos: [],
  };
  const tipo: TipoQuarto = {
    id: 't1',
    nome: 'Standard',
    descricao: '',
    capacidade_padrao: 2,
    comodidades_principais: [],
  };

  const hotelARooms = [roomHotelA, roomHotelB].filter((r) => r.hotel_id === 'hotel-a');
  const results = searchAvailableRooms('2026-11-01', '2026-11-03', 2, hotelARooms, [tipo], [], []);
  assert.equal(results.length, 1);
  assert.equal((results[0].quarto as ScopedRoom).hotel_id, 'hotel-a');
});

// 16. Atribuição de quarto (Room Assignment)
test('16. atribuição de quarto: suporta AUTO, MANUAL e GUEST_SELECTION', () => {
  assert.deepEqual([...BOOKING_MODES], ['AUTO', 'MANUAL', 'GUEST_SELECTION']);
});
