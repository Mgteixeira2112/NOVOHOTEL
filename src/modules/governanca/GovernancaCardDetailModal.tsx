import React from 'react';
import { CalendarClock, CheckCircle2, ClipboardList, DoorClosed, MessageSquareText, Tag, User, X } from 'lucide-react';
import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { getGovernancaAssignedName } from './governancaWorkspaceModel';

const formatDate = (value?: string | null) => !value ? '—' : new Date(value).toLocaleString('pt-BR');

export const GovernancaCardDetailModal: React.FC<{
  card: KanbanV2Card | null;
  columns: KanbanV2Column[];
  onClose: () => void;
}> = ({ card, columns, onClose }) => {
  if (!card) return null;
  const column = columns.find(item => item.id === card.column_id);
  const checklist = Array.isArray(card.checklist) ? card.checklist : [];
  const comments = Array.isArray(card.comments) ? card.comments : [];
  const tags = Array.isArray(card.tags) ? card.tags : [];
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata : {};

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-800">{column?.nome || 'Tarefa'}</span><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{card.prioridade || 'normal'}</span></div><h2 className="mt-2 text-xl font-black text-slate-950">{card.titulo}</h2>{card.descricao && <p className="mt-1 text-sm text-slate-500">{card.descricao}</p>}</div>
        <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Informações</h3><div className="mt-3 space-y-3 text-xs">
          <div className="flex items-center gap-3"><DoorClosed className="h-4 w-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Quarto / Local</p><strong>{card.room_number ? `Quarto ${card.room_number}` : card.location || 'Não informado'}</strong></div></div>
          <div className="flex items-center gap-3"><User className="h-4 w-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Responsável</p><strong>{getGovernancaAssignedName(card) || 'Sem responsável'}</strong></div></div>
          <div className="flex items-center gap-3"><CalendarClock className="h-4 w-4 text-slate-400" /><div><p className="text-[10px] text-slate-400">Criado / atualizado</p><strong>{formatDate(card.created_at)}</strong><p className="text-[10px] text-slate-400">{formatDate(card.updated_at)}</p></div></div>
        </div></section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-slate-400" /><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Checklist</h3></div><div className="mt-3 space-y-2">{checklist.length ? checklist.map((item: any, index) => <div key={item?.id || index} className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-xs"><CheckCircle2 className={`mt-0.5 h-4 w-4 ${item?.completed || item?.done ? 'text-emerald-500' : 'text-slate-300'}`} /><span className={item?.completed || item?.done ? 'line-through text-slate-400' : 'text-slate-700'}>{item?.text || item?.label || item?.title || `Item ${index + 1}`}</span></div>) : <p className="text-xs text-slate-400">Nenhum item de checklist.</p>}</div></section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Tags e contexto</h3></div><div className="mt-3 flex flex-wrap gap-2">{tags.length ? tags.map((tag: any, index) => <span key={tag?.id || index} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{typeof tag === 'string' ? tag : tag?.name || tag?.label || 'Tag'}</span>) : <span className="text-xs text-slate-400">Sem tags.</span>}</div>{Object.keys(metadata).length > 0 && <pre className="mt-3 max-h-36 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] text-slate-200">{JSON.stringify(metadata, null, 2)}</pre>}</section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-slate-400" /><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Comentários / observações</h3></div>{card.notes && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{card.notes}</p>}<div className="mt-3 space-y-2">{comments.length ? comments.map((comment: any, index) => <div key={comment?.id || index} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-700">{comment?.text || comment?.content || String(comment)}</p></div>) : !card.notes && <p className="text-xs text-slate-400">Nenhum comentário registrado.</p>}</div></section>
      </div>
    </div>
  </div>;
};
