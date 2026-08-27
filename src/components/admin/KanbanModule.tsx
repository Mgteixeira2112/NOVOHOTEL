import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Clock3, GripVertical, LayoutDashboard, Plus, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KANBAN_TENANT_ID, kanbanRealtime, KanbanV2Board, KanbanV2Card, KanbanV2Column } from '../../services/kanbanRealtime';

const departmentName = (value?: string) => ({ recepcao: 'Recepção', governanca: 'Governança', cozinha: 'Cozinha', manutencao: 'Manutenção', financeiro: 'Financeiro', almoxarifado: 'Almoxarifado', operacao: 'Operação' } as Record<string, string>)[value || ''] || value || 'Operação';

export const KanbanModule: React.FC = () => {
  const { currentUser } = useHotel();
  const [boards, setBoards] = useState<KanbanV2Board[]>([]);
  const [columns, setColumns] = useState<KanbanV2Column[]>([]);
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [activeBoardId, setActiveBoardId] = useState('');
  const [status, setStatus] = useState('CONNECTING');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('normal');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await kanbanRealtime.load(KANBAN_TENANT_ID);
      setBoards(result.boards);
      setColumns(result.columns);
      setCards(result.cards);
      setActiveBoardId(current => result.boards.some(b => b.id === current) ? current : (result.boards[0]?.id || ''));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar os Kanbans operacionais do Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const cleanup = kanbanRealtime.subscribe(KANBAN_TENANT_ID, {
      onInsert: card => setCards(current => current.some(c => c.id === card.id) ? current : [...current, card]),
      onUpdate: card => setCards(current => current.some(c => c.id === card.id) ? current.map(c => c.id === card.id ? card : c) : [...current, card]),
      onDelete: card => setCards(current => current.filter(c => c.id !== card.id)),
      onStatus: next => setStatus(next),
    });
    return cleanup;
  }, []);

  const activeBoard = boards.find(b => b.id === activeBoardId);
  const boardColumns = useMemo(() => columns.filter(c => c.board_id === activeBoardId).sort((a, b) => a.ordem - b.ordem), [columns, activeBoardId]);
  const boardCards = useMemo(() => cards.filter(c => c.board_id === activeBoardId && !c.is_archived).sort((a, b) => a.ordem - b.ordem), [cards, activeBoardId]);

  const createCard = async () => {
    if (!activeBoardId || !boardColumns[0] || !newTitle.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const card = await kanbanRealtime.createCard({
        hotelId: KANBAN_TENANT_ID,
        boardId: activeBoardId,
        columnId: boardColumns[0].id,
        titulo: newTitle,
        descricao: newDescription,
        prioridade: newPriority,
        departamento: activeBoard?.departamento,
      });
      setCards(current => current.some(c => c.id === card.id) ? current : [...current, card]);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('normal');
      setModalOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar card.');
    } finally {
      setSaving(false);
    }
  };

  const moveCard = async (card: KanbanV2Card | undefined, targetColumnId: string) => {
    if (!card || card.column_id === targetColumnId || saving) return;
    setSaving(true);
    setError('');
    try {
      const persisted = await kanbanRealtime.moveCard(KANBAN_TENANT_ID, card.id, targetColumnId);
      setCards(current => current.map(c => c.id === persisted.id ? persisted : c));
    } catch (e: any) {
      setError(e?.message || 'Falha ao mover card. A alteração não foi salva.');
    } finally {
      setSaving(false);
      setDraggingId(null);
    }
  };

  const activeCount = boardCards.length;
  const doneCount = boardCards.filter(c => c.completed_at).length;

  return (
    <div className="min-h-full bg-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <div className="max-w-[1800px] mx-auto space-y-5">
        <header className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white grid place-items-center"><LayoutDashboard className="w-5 h-5" /></div>
                <div><h1 className="text-2xl font-black text-slate-950 tracking-tight">Operação</h1><p className="text-sm text-slate-500">Kanbans operacionais em tempo real</p></div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status === 'SUBSCRIBED' ? 'bg-emerald-50 text-emerald-700' : status === 'CONNECTING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                  {status === 'SUBSCRIBED' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {status === 'SUBSCRIBED' ? 'Tempo real conectado' : status === 'CONNECTING' ? 'Conectando' : 'Sincronização Ativa'}
                </span>
              </div>
              <div className="flex gap-2 mt-4 text-xs text-slate-500"><span>{activeCount} tarefas</span><span>•</span><span>{doneCount} concluídas</span><span>•</span><span>{currentUser?.nome || 'Usuário'}</span><span>•</span><span>Banco: {KANBAN_TENANT_ID}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void load()} className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Atualizar</button>
              <button onClick={() => setModalOpen(true)} disabled={!activeBoardId || !boardColumns.length || saving} className="h-11 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40"><Plus className="w-4 h-4" /> Novo card</button>
            </div>
          </div>
        </header>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 p-4 flex items-start gap-3"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><div className="flex-1 text-sm font-semibold break-words">{error}</div><button onClick={() => setError('')}><X className="w-4 h-4" /></button></div>}

        {boards.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{boards.map(board => <button key={board.id} onClick={() => setActiveBoardId(board.id)} className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm font-bold transition ${activeBoardId === board.id ? 'bg-slate-950 text-white border-slate-950 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>{board.nome}<span className="ml-2 opacity-60">{departmentName(board.departamento)}</span></button>)}</div>}

        {loading ? <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500">Carregando dados reais do Supabase…</div> : boardColumns.length === 0 ? <div className="rounded-3xl bg-white border border-dashed border-slate-300 p-12 text-center"><h2 className="font-black text-slate-900">Nenhum quadro configurado</h2><p className="text-sm text-slate-500 mt-2">Não há colunas para o quadro selecionado.</p></div> :
          <main className="grid gap-4 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${Math.max(boardColumns.length, 1)}, minmax(280px, 1fr))` }}>
            {boardColumns.map(column => {
              const columnCards = boardCards.filter(card => card.column_id === column.id);
              return <section key={column.id} onDragOver={e => e.preventDefault()} onDrop={() => void moveCard(boardCards.find(c => c.id === draggingId), column.id)} className="min-h-[520px] rounded-3xl bg-white border border-slate-200 shadow-sm p-3.5">
                <div className="flex items-center justify-between px-2 pb-3"><div><h2 className="font-black text-slate-900">{column.nome}</h2><p className="text-[11px] text-slate-400 mt-0.5">{columnCards.length} {columnCards.length === 1 ? 'tarefa' : 'tarefas'}</p></div><span className="w-7 h-7 rounded-lg bg-slate-100 grid place-items-center text-xs font-black text-slate-500">{columnCards.length}</span></div>
                <div className="space-y-2.5">
                  {columnCards.map(card => <article key={card.id} draggable onDragStart={() => setDraggingId(card.id)} onDragEnd={() => setDraggingId(null)} className={`group rounded-2xl border bg-white p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition ${draggingId === card.id ? 'opacity-40' : 'border-slate-200'}`}>
                    <div className="flex gap-2"><GripVertical className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-sm text-slate-900 leading-snug">{card.titulo}</h3><span className={`shrink-0 text-[10px] uppercase font-black px-2 py-1 rounded-full ${card.prioridade === 'critica' ? 'bg-rose-100 text-rose-700' : card.prioridade === 'atencao' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{card.prioridade}</span></div>{card.descricao && <p className="text-xs text-slate-500 mt-2 line-clamp-3">{card.descricao}</p>}
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400"><span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{new Date(card.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>{card.room_number && <span>Quarto {card.room_number}</span>}</div>
                    </div></div>
                  </article>)}
                  {columnCards.length === 0 && <div className="h-36 rounded-2xl border border-dashed border-slate-200 grid place-items-center text-xs text-slate-400">Solte cards aqui</div>}
                </div>
              </section>;
            })}
          </main>}
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm p-4 grid place-items-center" onMouseDown={() => !saving && setModalOpen(false)}><div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-black text-slate-950">Novo card</h2><p className="text-xs text-slate-500 mt-1">Será salvo diretamente no Supabase.</p></div><button onClick={() => !saving && setModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div><label className="block text-xs font-black text-slate-600 mb-1.5">Título</label><input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && void createCard()} className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Ex.: Solicitação do hóspede" /><label className="block text-xs font-black text-slate-600 mb-1.5 mt-4">Descrição</label><textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full min-h-24 p-4 rounded-xl border border-slate-200 outline-none resize-none" placeholder="Detalhes da tarefa…" /><label className="block text-xs font-black text-slate-600 mb-1.5 mt-4">Prioridade</label><select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white"><option value="normal">Normal</option><option value="atencao">Atenção</option><option value="critica">Crítica</option></select><button disabled={saving || !newTitle.trim()} onClick={() => void createCard()} className="w-full h-12 mt-5 rounded-xl bg-slate-950 text-white font-black disabled:opacity-40 flex items-center justify-center gap-2">{saving ? 'Salvando…' : <><Check className="w-4 h-4" /> Salvar card</>}</button></div></div>}
    </div>
  );
};
