import React from 'react';
import { BedDouble, CircleAlert, UserRound } from 'lucide-react';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { Hospede, Quarto, Reserva } from '../../types';

interface ReceptionRoomsKanbanProps {
  columns: KanbanV2Column[];
  cards: KanbanV2Card[];
  rooms: Quarto[];
  reservations: Reserva[];
  guests: Hospede[];
  savingId?: string | null;
  onMove: (card: KanbanV2Card, columnId: string) => void;
}

function roomId(card: KanbanV2Card) {
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata as Record<string, unknown> : {};
  return typeof metadata.room_id === 'string' ? metadata.room_id : '';
}

function currentReservation(room: Quarto, reservations: Reserva[]) {
  return reservations.find(reservation => reservation.quarto_id === room.id && reservation.status === 'checkin_realizado') || null;
}

export const ReceptionRoomsKanban: React.FC<ReceptionRoomsKanbanProps> = ({
  columns,
  cards,
  rooms,
  reservations,
  guests,
  savingId,
  onMove,
}) => {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Mapa operacional · Quartos</p>
        <h2 className="text-lg font-black text-slate-950">Kanban de quartos</h2>
        <p className="mt-1 text-xs text-slate-500">Quadro separado das tarefas da Recepção. Cada card representa um quarto e sua posição acompanha o status operacional.</p>
      </div>
      <span className="text-[10px] font-bold text-slate-400">{cards.length} quartos ativos no quadro</span>
    </div>

    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-max grid-flow-col auto-cols-[270px] gap-3">
        {columns.map(column => {
          const columnCards = cards.filter(card => card.column_id === column.id);
          return <div key={column.id} className="min-h-[260px] rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <strong className="text-[11px] font-black uppercase tracking-wide text-slate-700">{column.nome}</strong>
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-[10px] font-black text-slate-500 shadow-sm">{columnCards.length}</span>
            </div>

            <div className="space-y-2">
              {columnCards.map(card => {
                const room = rooms.find(item => item.id === roomId(card)) || rooms.find(item => String(item.numero) === String(card.room_number));
                const reservation = room ? currentReservation(room, reservations) : null;
                const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : null;
                const busy = savingId === card.id;

                return <article key={card.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 shrink-0 text-blue-600" />
                        <strong className="truncate text-sm font-black text-slate-950">Quarto {room?.numero || card.room_number || '—'}</strong>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-slate-500">{room?.nome || 'Acomodação'}{room?.andar ? ` · ${room.andar}º andar` : ''}</p>
                    </div>
                    {!room?.ativo && <span className="rounded-lg bg-slate-100 px-2 py-1 text-[8px] font-black uppercase text-slate-500">Inativo</span>}
                  </div>

                  {guest && <div className="mt-3 rounded-xl bg-blue-50 p-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800"><UserRound className="h-3 w-3" />{guest.nome}</div>
                    <p className="mt-1 text-[9px] text-blue-600">Hóspede atualmente vinculado ao quarto</p>
                  </div>}

                  {room?.status_manutencao_motivo && <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 p-2 text-[9px] text-amber-800">
                    <CircleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{room.status_manutencao_motivo}</span>
                  </div>}

                  <label className="mt-3 block">
                    <span className="mb-1 block text-[9px] font-black uppercase text-slate-400">Status do quarto</span>
                    <select
                      value={card.column_id}
                      disabled={busy}
                      onChange={event => onMove(card, event.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-700 outline-none disabled:opacity-60"
                    >
                      {columns.map(option => <option key={option.id} value={option.id}>{option.nome}</option>)}
                    </select>
                  </label>
                </article>;
              })}

              {columnCards.length === 0 && <div className="grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-4 text-center text-[10px] text-slate-400">Nenhum quarto neste status</div>}
            </div>
          </div>;
        })}
      </div>
    </div>
  </section>;
};
