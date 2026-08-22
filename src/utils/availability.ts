import { Quarto, Reserva, BloqueioQuarto, TipoQuarto, AvailabilityResult } from '../types';

/**
 * Verifica se dois intervalos de datas [inicio1, fim1] e [inicio2, fim2] se sobrepõem.
 * Formato: 'AAAA-MM-DD'
 * Regra de Negócio:
 * Ex: Uma reserva de 10/09 a 13/09 não impede uma nova de 13/09 a 18/09 (mesmo dia de checkout/checkin é permitido),
 * mas impede sobreposição estrita (ex: 11/09 a 14/09).
 */
export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = new Date(startA + 'T00:00:00');
  const aEnd = new Date(endA + 'T00:00:00');
  const bStart = new Date(startB + 'T00:00:00');
  const bEnd = new Date(endB + 'T00:00:00');

  // Sobreposição ocorre se A inicia antes do término de B E A termina após o início de B
  return aStart < bEnd && aEnd > bStart;
}

// Calcula o número total de diárias entre duas datas
export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

// Verifica se um determinado quarto está disponível no período informado
export function isRoomAvailable(
  quartoId: string,
  checkIn: string,
  checkOut: string,
  reservations: Reserva[],
  blocks: BloqueioQuarto[],
  ignoreReservationId?: string
): boolean {
  // Verifica conflito com reservas ativas
  const conflictingReservation = reservations.find((res) => {
    if (res.quarto_id !== quartoId) return false;
    if (ignoreReservationId && res.id === ignoreReservationId) return false;
    if (res.status === 'cancelada' || res.status === 'checkout_concluido') {
      // Reservas canceladas não bloqueiam datas futuras
      if (res.status === 'cancelada') return false;
    }
    return datesOverlap(checkIn, checkOut, res.checkin, res.checkout);
  });

  if (conflictingReservation) return false;

  // Verifica conflito com bloqueios operacionais (manutenção, faxina profunda)
  const conflictingBlock = blocks.find((block) => {
    if (block.quarto_id !== quartoId) return false;
    return datesOverlap(checkIn, checkOut, block.data_inicio, block.data_fim);
  });

  if (conflictingBlock) return false;

  return true;
}

/**
 * Pesquisa e retorna todos os quartos ativos e disponíveis para um período e quantidade de hóspedes.
 */
export function searchAvailableRooms(
  checkIn: string,
  checkOut: string,
  guestsCount: number,
  rooms: Quarto[],
  roomTypes: TipoQuarto[],
  reservations: Reserva[],
  blocks: BloqueioQuarto[],
  taxRatePercent: number = 5
): AvailabilityResult[] {
  const nights = calculateNights(checkIn, checkOut);
  const results: AvailabilityResult[] = [];

  const activeRooms = rooms.filter((r) => r.ativo && r.capacidade >= guestsCount);

  for (const room of activeRooms) {
    const available = isRoomAvailable(room.id, checkIn, checkOut, reservations, blocks);
    if (available) {
      const tipo = roomTypes.find((t) => t.id === room.tipo_quarto_id) || {
        id: 'default',
        nome: 'Quarto Standard',
        descricao: '',
        capacidade_padrao: room.capacidade,
        comodidades_principais: room.comodidades,
      };

      const valorDiarias = room.valor_diaria * nights;
      const taxas = Math.round(valorDiarias * (taxRatePercent / 100));
      const valorTotal = valorDiarias + taxas;

      results.push({
        disponivel: true,
        quarto: room,
        tipo,
        noites: nights,
        valorDiarias,
        taxas,
        valorTotal,
      });
    }
  }

  return results.sort((a, b) => a.valorTotal - b.valorTotal);
}

// Gera código alfanumérico único para a reserva (ex: GH-84920)
export function generateBookingCode(): string {
  const prefix = 'GH';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

// Gera PIN numérico aleatório de 6 dígitos para fechadura eletrônica inteligente
export function generateSmartLockPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Formata data ISO (AAAA-MM-DD) para formato brasileiro (DD/MM/AAAA)
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

