import React, { useEffect, useMemo, useState } from 'react';
import { BedDouble, CircleAlert, Edit3, ImageIcon, LockKeyhole, Trash2, UserRound, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
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

const STATUS_THEME: Record<string, { card: string; badge: string; accent: string; column: string }> = {
  'room-col-disponivel': { card: 'border-emerald-200 bg-emerald-50/70', badge: 'bg-emerald-600 text-white', accent: 'text-emerald-700', column: 'border-emerald-200 bg-emerald-50/40' },
  'room-col-ocupado': { card: 'border-blue-200 bg-blue-50/70', badge: 'bg-blue-600 text-white', accent: 'text-blue-700', column: 'border-blue-200 bg-blue-50/40' },
  'room-col-sujo': { card: 'border-orange-200 bg-orange-50/80', badge: 'bg-orange-600 text-white', accent: 'text-orange-700', column: 'border-orange-200 bg-orange-50/40' },
  'room-col-limpeza': { card: 'border-cyan-200 bg-cyan-50/80', badge: 'bg-cyan-600 text-white', accent: 'text-cyan-700', column: 'border-cyan-200 bg-cyan-50/40' },
  'room-col-vistoria': { card: 'border-violet-200 bg-violet-50/80', badge: 'bg-violet-600 text-white', accent: 'text-violet-700', column: 'border-violet-200 bg-violet-50/40' },
  'room-col-manutencao': { card: 'border-rose-200 bg-rose-50/80', badge: 'bg-rose-600 text-white', accent: 'text-rose-700', column: 'border-rose-200 bg-rose-50/40' },
  'room-col-bloqueado': { card: 'border-slate-400 bg-slate-100', badge: 'bg-slate-800 text-white', accent: 'text-slate-800', column: 'border-slate-300 bg-slate-100/80' },
  'room-col-outros': { card: 'border-stone-200 bg-stone-50', badge: 'bg-stone-600 text-white', accent: 'text-stone-700', column: 'border-stone-200 bg-stone-50' },
};

function roomId(card: KanbanV2Card) {
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata as Record<string, unknown> : {};
  return typeof metadata.room_id === 'string' ? metadata.room_id : '';
}

function currentReservation(room: Quarto, reservations: Reserva[]) {
  return reservations.find(reservation => reservation.quarto_id === room.id && reservation.status === 'checkin_realizado') || null;
}

function formatMoney(value?: number) {
  if (typeof value !== 'number') return 'Não informado';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value?: string) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => <div className="min-w-0">
  <span className="block text-[8px] font-black uppercase tracking-wide text-slate-400">{label}</span>
  <span className="mt-0.5 block break-words text-[10px] font-semibold text-slate-700">{value || 'Não informado'}</span>
</div>;

export const ReceptionRoomsKanban: React.FC<ReceptionRoomsKanbanProps> = ({
  columns,
  cards,
  rooms,
  reservations,
  guests,
  savingId,
  onMove,
}) => {
  const { roomTypes, updateRoom, deleteRoom } = useHotel();
  const [editingRoom, setEditingRoom] = useState<Quarto | null>(null);
  const [draft, setDraft] = useState<Partial<Quarto>>({});

  useEffect(() => {
    if (editingRoom) setDraft({ ...editingRoom });
  }, [editingRoom]);

  const cardsWithRooms = useMemo(() => cards.filter(card => rooms.some(room => room.id === roomId(card) || String(room.numero) === String(card.room_number))), [cards, rooms]);

  const saveRoom = () => {
    if (!editingRoom) return;
    updateRoom(editingRoom.id, {
      ...draft,
      numero: String(draft.numero || editingRoom.numero).trim(),
      nome: String(draft.nome || '').trim(),
      andar: Number(draft.andar ?? editingRoom.andar),
      capacidade: Number(draft.capacidade ?? editingRoom.capacidade),
      valor_diaria: Number(draft.valor_diaria ?? draft.preco_diaria ?? editingRoom.valor_diaria ?? editingRoom.preco_diaria ?? 0),
      preco_diaria: Number(draft.valor_diaria ?? draft.preco_diaria ?? editingRoom.valor_diaria ?? editingRoom.preco_diaria ?? 0),
      tamanho_m2: draft.tamanho_m2 === undefined || draft.tamanho_m2 === null || draft.tamanho_m2 === '' as any ? undefined : Number(draft.tamanho_m2),
      fechadura_bateria: draft.fechadura_bateria === undefined || draft.fechadura_bateria === null || draft.fechadura_bateria === '' as any ? undefined : Number(draft.fechadura_bateria),
    });
    setEditingRoom(null);
  };

  const removeRoom = (room: Quarto) => {
    if (!window.confirm(`Excluir definitivamente o Quarto ${room.numero}? Esta ação remove o cadastro e sua projeção no Kanban de Quartos.`)) return;
    if (!window.confirm(`Confirme novamente a exclusão do Quarto ${room.numero}.`)) return;
    deleteRoom(room.id);
  };

  return <>
    <section className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Mapa operacional · Quartos</p>
          <h2 className="text-lg font-black text-slate-950">Kanban de quartos</h2>
          <p className="mt-1 text-xs text-slate-500">Quadro separado das tarefas da Recepção. As cores identificam imediatamente o status operacional de cada acomodação.</p>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{cardsWithRooms.length} quartos ativos no quadro</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-max grid-flow-col auto-cols-[330px] gap-3">
          {columns.map(column => {
            const theme = STATUS_THEME[column.id] || STATUS_THEME['room-col-outros'];
            const columnCards = cardsWithRooms.filter(card => card.column_id === column.id);
            return <div key={column.id} className={`min-h-[300px] rounded-2xl border p-3 ${theme.column}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <strong className={`text-[11px] font-black uppercase tracking-wide ${theme.accent}`}>{column.nome}</strong>
                <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[10px] font-black shadow-sm ${theme.badge}`}>{columnCards.length}</span>
              </div>

              <div className="space-y-3">
                {columnCards.map(card => {
                  const room = rooms.find(item => item.id === roomId(card)) || rooms.find(item => String(item.numero) === String(card.room_number));
                  if (!room) return null;
                  const reservation = currentReservation(room, reservations);
                  const guest = reservation ? guests.find(item => item.id === reservation.hospede_id) : null;
                  const roomType = roomTypes.find(type => type.id === room.tipo_quarto_id);
                  const busy = savingId === card.id;

                  return <article key={card.id} className={`overflow-hidden rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}>
                    {room.fotos?.[0] && <div className="-mx-3 -mt-3 mb-3 h-24 overflow-hidden border-b border-white/70 bg-white/40">
                      <img src={room.fotos[0]} alt={`Quarto ${room.numero}`} className="h-full w-full object-cover" />
                    </div>}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <BedDouble className={`h-4 w-4 shrink-0 ${theme.accent}`} />
                          <strong className="truncate text-sm font-black text-slate-950">Quarto {room.numero}</strong>
                        </div>
                        <p className="mt-1 truncate text-[10px] font-semibold text-slate-600">{room.nome || roomType?.nome || 'Acomodação'}</p>
                      </div>
                      <span className={`rounded-lg px-2 py-1 text-[8px] font-black uppercase ${theme.badge}`}>{column.nome}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-white/80 bg-white/65 p-2.5">
                      <Field label="Tipo" value={roomType?.nome || room.tipo_quarto_id} />
                      <Field label="Andar" value={`${room.andar}º andar`} />
                      <Field label="Capacidade" value={`${room.capacidade} hóspede(s)`} />
                      <Field label="Diária" value={formatMoney(room.valor_diaria ?? room.preco_diaria)} />
                      <Field label="Tamanho" value={room.tamanho_m2 ? `${room.tamanho_m2} m²` : 'Não informado'} />
                      <Field label="Vista" value={room.vista} />
                      <Field label="Cama" value={room.cama} />
                      <Field label="Cadastro" value={room.ativo ? 'Ativo' : 'Inativo'} />
                      <Field label="Governança" value={room.status_governanca || room.status_housekeeping} />
                      <Field label="Responsável limpeza" value={room.responsavel_limpeza} />
                      <Field label="Última limpeza" value={formatDate(room.ultima_limpeza)} />
                      <Field label="Bateria fechadura" value={typeof room.fechadura_bateria === 'number' ? `${room.fechadura_bateria}%` : 'Não informado'} />
                    </div>

                    {room.descricao && <div className="mt-2 rounded-xl border border-white/80 bg-white/65 p-2 text-[9px] leading-relaxed text-slate-600"><b>Descrição:</b> {room.descricao}</div>}

                    {room.comodidades?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">
                      {room.comodidades.map(item => <span key={item} className="rounded-md border border-white bg-white/75 px-1.5 py-1 text-[8px] font-bold text-slate-600">{item}</span>)}
                    </div>}

                    {guest && <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/90 p-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-800"><UserRound className="h-3 w-3" />{guest.nome}</div>
                      <p className="mt-1 text-[9px] text-blue-700">Reserva {reservation?.codigo || reservation?.codigo_reserva || reservation?.id}</p>
                      <p className="mt-1 text-[9px] text-blue-600">Check-in {reservation?.data_checkin || reservation?.checkin || '—'} · Check-out {reservation?.data_checkout || reservation?.checkout || '—'}</p>
                      <p className="mt-1 text-[9px] text-blue-600">{guest.telefone || 'Telefone não informado'} · {guest.email || 'E-mail não informado'}</p>
                    </div>}

                    {room.status_manutencao_motivo && <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[9px] text-amber-800">
                      <CircleAlert className="mt-0.5 h-3 w-3 shrink-0" /><span><b>Manutenção:</b> {room.status_manutencao_motivo}</span>
                    </div>}

                    {room.notas_internas && <div className="mt-2 rounded-xl border border-slate-200 bg-white/80 p-2 text-[9px] text-slate-600"><b>Notas:</b> {room.notas_internas}</div>}

                    <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-slate-600">
                      <div className="rounded-xl border border-white/80 bg-white/65 p-2"><LockKeyhole className="mb-1 h-3 w-3" /><b>PIN:</b> {room.fechadura_pin || 'Não informado'}</div>
                      <div className="rounded-xl border border-white/80 bg-white/65 p-2"><ImageIcon className="mb-1 h-3 w-3" /><b>Fotos:</b> {room.fotos?.length || 0}</div>
                    </div>

                    <label className="mt-3 block">
                      <span className="mb-1 block text-[9px] font-black uppercase text-slate-500">Alterar status do quarto</span>
                      <select value={card.column_id} disabled={busy} onChange={event => onMove(card, event.target.value)} className="h-9 w-full rounded-xl border border-white bg-white/90 px-2 text-[10px] font-black text-slate-700 outline-none disabled:opacity-60">
                        {columns.map(option => <option key={option.id} value={option.id}>{option.nome}</option>)}
                      </select>
                    </label>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/80 pt-3">
                      <button type="button" onClick={() => setEditingRoom(room)} className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black text-slate-700 hover:bg-slate-50"><Edit3 className="h-3.5 w-3.5" />Editar</button>
                      <button type="button" onClick={() => removeRoom(room)} className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-[10px] font-black text-rose-700 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" />Excluir</button>
                    </div>
                  </article>;
                })}

                {columnCards.length === 0 && <div className="grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-center text-[10px] text-slate-400">Nenhum quarto neste status</div>}
              </div>
            </div>;
          })}
        </div>
      </div>
    </section>

    {editingRoom && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setEditingRoom(null); }}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Recepção · Quartos</p><h3 className="text-lg font-black">Editar Quarto {editingRoom.numero}</h3></div>
          <button type="button" onClick={() => setEditingRoom(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">Número<input value={String(draft.numero ?? '')} onChange={e => setDraft(cur => ({ ...cur, numero: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Nome<input value={String(draft.nome ?? '')} onChange={e => setDraft(cur => ({ ...cur, nome: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Tipo<select value={String(draft.tipo_quarto_id ?? '')} onChange={e => setDraft(cur => ({ ...cur, tipo_quarto_id: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3">{roomTypes.map(type => <option key={type.id} value={type.id}>{type.nome}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-600">Andar<input type="number" value={Number(draft.andar ?? 0)} onChange={e => setDraft(cur => ({ ...cur, andar: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Capacidade<input type="number" value={Number(draft.capacidade ?? 0)} onChange={e => setDraft(cur => ({ ...cur, capacidade: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Diária<input type="number" step="0.01" value={Number(draft.valor_diaria ?? draft.preco_diaria ?? 0)} onChange={e => setDraft(cur => ({ ...cur, valor_diaria: Number(e.target.value), preco_diaria: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Tamanho m²<input type="number" value={draft.tamanho_m2 ?? ''} onChange={e => setDraft(cur => ({ ...cur, tamanho_m2: e.target.value === '' ? undefined : Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Vista<input value={String(draft.vista ?? '')} onChange={e => setDraft(cur => ({ ...cur, vista: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Cama<input value={String(draft.cama ?? '')} onChange={e => setDraft(cur => ({ ...cur, cama: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">PIN da fechadura<input value={String(draft.fechadura_pin ?? '')} onChange={e => setDraft(cur => ({ ...cur, fechadura_pin: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-xs font-bold text-slate-600">Bateria da fechadura (%)<input type="number" min="0" max="100" value={draft.fechadura_bateria ?? ''} onChange={e => setDraft(cur => ({ ...cur, fechadura_bateria: e.target.value === '' ? undefined : Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-600"><input type="checkbox" checked={Boolean(draft.ativo)} onChange={e => setDraft(cur => ({ ...cur, ativo: e.target.checked }))} />Quarto ativo</label>
          <label className="sm:col-span-2 text-xs font-bold text-slate-600">Descrição<textarea value={String(draft.descricao ?? '')} onChange={e => setDraft(cur => ({ ...cur, descricao: e.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3" /></label>
          <label className="sm:col-span-2 text-xs font-bold text-slate-600">Motivo de manutenção<textarea value={String(draft.status_manutencao_motivo ?? '')} onChange={e => setDraft(cur => ({ ...cur, status_manutencao_motivo: e.target.value }))} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3" /></label>
          <label className="sm:col-span-2 text-xs font-bold text-slate-600">Notas internas<textarea value={String(draft.notas_internas ?? '')} onChange={e => setDraft(cur => ({ ...cur, notas_internas: e.target.value }))} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3" /></label>
          <label className="sm:col-span-2 text-xs font-bold text-slate-600">Comodidades (separadas por vírgula)<textarea value={(draft.comodidades || []).join(', ')} onChange={e => setDraft(cur => ({ ...cur, comodidades: e.target.value.split(',').map(item => item.trim()).filter(Boolean) }))} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3" /></label>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white p-4"><button type="button" onClick={() => setEditingRoom(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black">Cancelar</button><button type="button" onClick={saveRoom} className="h-10 rounded-xl bg-slate-950 px-5 text-xs font-black text-white">Salvar alterações</button></div>
      </div>
    </div>}
  </>;
};
