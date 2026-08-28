import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  DoorClosed,
  LogOut,
  Play,
  Search,
  Sparkles,
  User as UserIcon,
  Users,
  Wifi,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { KanbanLocalAutomationBridge } from '../../components/admin/KanbanLocalAutomationBridge';

const GOVERNANCA_BOARD_ID = 'kanban-board-governanca';
const GOVERNANCA_STAGES = {
  pending: 'gov-col-a-limpar',
  working: 'gov-col-em-limpeza',
  inspection: 'gov-col-inspecao',
  done: 'gov-col-liberado',
} as const;

type Scope = 'mine' | 'sector';

const dateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

const assignedUserId = (card: KanbanV2Card) => {
  const assigned = card.assigned_to as any;
  return (card as any).assigned_user_id || assigned?.id || '';
};

const assignedName = (card: KanbanV2Card) => {
  const assigned = card.assigned_to as any;
  return assigned?.name || '';
};

export const GovernancaWorkspace: React.FC = () => {
  const { currentUser, logout } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [scope, setScope] = useState<Scope>('mine');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState('CONNECTING');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const result = await kanbanV2.load(KANBAN_TENANT_ID);
      setColumns(result.columns.filter(column => column.board_id === GOVERNANCA_BOARD_ID));
      setCards(result.cards.filter(card => card.board_id === GOVERNANCA_BOARD_ID && !card.is_archived));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar a operação da Governança.');
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const cleanup = kanbanV2.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => {
        if (card.board_id !== GOVERNANCA_BOARD_ID || card.is_archived) return;
        setCards(current => current.some(item => item.id === card.id) ? current : [...current, card]);
      },
      onUpdate: card => {
        setCards(current => {
          if (card.board_id !== GOVERNANCA_BOARD_ID || card.is_archived) return current.filter(item => item.id !== card.id);
          return current.some(item => item.id === card.id)
            ? current.map(item => item.id === card.id ? card : item)
            : [...current, card];
        });
      },
      onDelete: card => setCards(current => current.filter(item => item.id !== card.id)),
      onStatus: next => setStatus(next),
    });
    return cleanup;
  }, []);

  const visibleCards = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');
    return cards
      .filter(card => scope === 'sector' || assignedUserId(card) === currentUser?.id)
      .filter(card => !normalized || [card.titulo, card.descricao, card.room_number, assignedName(card)]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalized));
  }, [cards, scope, currentUser?.id, search]);

  const counts = useMemo(() => ({
    pending: cards.filter(card => card.column_id === GOVERNANCA_STAGES.pending).length,
    working: cards.filter(card => card.column_id === GOVERNANCA_STAGES.working).length,
    inspection: cards.filter(card => card.column_id === GOVERNANCA_STAGES.inspection).length,
    done: cards.filter(card => card.column_id === GOVERNANCA_STAGES.done).length,
  }), [cards]);

  const move = async (card: KanbanV2Card, columnId: string) => {
    if (savingId) return;
    setSavingId(card.id);
    setError('');
    try {
      const updated = await kanbanCardGovernance.moveCard(card, columnId, { userId: currentUser?.id });
      setCards(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível atualizar a tarefa.');
    } finally {
      setSavingId(null);
    }
  };

  const actionFor = (card: KanbanV2Card) => {
    if (card.column_id === GOVERNANCA_STAGES.pending) {
      return <button disabled={savingId === card.id} onClick={() => void move(card, GOVERNANCA_STAGES.working)} className="w-full h-10 rounded-xl bg-slate-950 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40"><Play className="w-4 h-4" /> Iniciar limpeza</button>;
    }
    if (card.column_id === GOVERNANCA_STAGES.working) {
      return <button disabled={savingId === card.id} onClick={() => void move(card, GOVERNANCA_STAGES.inspection)} className="w-full h-10 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40"><ClipboardCheck className="w-4 h-4" /> Enviar para inspeção</button>;
    }
    if (card.column_id === GOVERNANANCA_STAGES.inspection) return null;
    return null;
  };

  const stageLabel = (columnId: string) => columns.find(column => column.id === columnId)?.nome || 'Tarefa';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <KanbanLocalAutomationBridge />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 grid place-items-center"><Sparkles className="w-5 h-5" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><h1 className="text-xl font-black">Governança</h1><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700"><Wifi className="w-3 h-3" />{status === 'SUBSCRIBED' ? 'Tempo real' : 'Sincronizando'}</span></div>
              <p className="text-xs text-slate-500">Operação de quartos e tarefas do setor</p>
            </div>
          </div>
          <div className="flex items-center gap-3"><div className="hidden sm:block text-right"><p className="text-xs font-black text-slate-800">{currentUser?.nome}</p><p className="text-[10px] text-slate-400">Governança</p></div><button onClick={logout} className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair</button></div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-5">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[['A limpar', counts.pending], ['Em limpeza', counts.working], ['Inspeção', counts.inspection], ['Liberados', counts.done]].map(([label, value], index) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"><div className="flex items-center justify-between"><p className="text-[11px] font-bold text-slate-500">{label}</p>{index === 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <DoorClosed className="w-4 h-4 text-slate-300" />}</div><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div><h2 className="text-base font-black">Central de trabalho</h2><p className="text-xs text-slate-500 mt-0.5">Cards especializados da Governança, movidos pelo motor Kanban selado.</p></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setScope('mine')} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${scope === 'mine' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}><UserIcon className="w-3.5 h-3.5" /> Meu trabalho</button>
              <button onClick={() => setScope('sector')} className={`h-9 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 ${scope === 'sector' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}><Users className="w-3.5 h-3.5" /> Meu setor</button>
            </div>
          </div>
          <label className="relative block mt-4 max-w-xl"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar quarto, tarefa ou responsável" className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-200" /></label>
        </section>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}

        <section className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {visibleCards.map(card => (
            <article key={card.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wide font-black text-amber-700">{stageLabel(card.column_id)}</p><h3 className="mt-1 text-sm font-black text-slate-950 leading-snug">{card.titulo}</h3></div>{card.room_number && <span className="shrink-0 rounded-xl bg-slate-950 px-2.5 py-1.5 text-[10px] font-black text-amber-300">Q. {card.room_number}</span>}</div>
              {card.descricao && <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">{card.descricao}</p>}
              <div className="rounded-2xl bg-slate-50 p-3 space-y-1.5 text-[10px] text-slate-500"><div className="flex items-center justify-between gap-2"><span>Criado</span><strong className="text-slate-700">{dateTime(card.created_at)}</strong></div><div className="flex items-center justify-between gap-2"><span>Alterado</span><strong className="text-slate-700">{dateTime(card.updated_at)}</strong></div><div className="flex items-center justify-between gap-2"><span>Responsável</span><strong className="text-slate-700 truncate">{assignedName(card) || 'Sem responsável'}</strong></div></div>
              {card.column_id === GOVERNANCA_STAGES.inspection ? <button disabled={savingId === card.id} onClick={() => void move(card, GOVERNANCA_STAGES.done)} className="w-full h-10 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40"><CheckCircle2 className="w-4 h-4" /> Liberar quarto</button> : actionFor(card)}
            </article>
          ))}
          {visibleCards.length === 0 && <div className="md:col-span-2 xl:col-span-3 2xl:col-span-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-12 text-center"><Sparkles className="w-6 h-6 mx-auto text-slate-300" /><h3 className="mt-3 text-sm font-black text-slate-700">Nenhuma tarefa nesta visão</h3><p className="mt-1 text-xs text-slate-400">Alterne entre Meu trabalho e Meu setor ou ajuste a busca.</p></div>}
        </section>
      </main>
    </div>
  );
};
