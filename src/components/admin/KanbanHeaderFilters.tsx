import React from 'react';
import { Archive, DoorClosed, Filter, RefreshCw, Search, User as UserIcon, X } from 'lucide-react';
import { KanbanV2Column } from '../../services/kanbanV2';

interface UserOption { id: string; nome: string; ativo: boolean }
interface RoomOption { id: string; numero: string }

interface KanbanHeaderFiltersProps {
  search: string;
  department: string;
  user: string;
  room: string;
  columnId: string;
  priority: string;
  archiveView: 'active' | 'archived' | 'all';
  users: UserOption[];
  rooms: RoomOption[];
  columns: KanbanV2Column[];
  canManageArchive: boolean;
  hasFilters: boolean;
  loading?: boolean;
  onSearch: (value: string) => void;
  onDepartment: (value: string) => void;
  onUser: (value: string) => void;
  onRoom: (value: string) => void;
  onColumn: (value: string) => void;
  onPriority: (value: string) => void;
  onArchiveView: (value: 'active' | 'archived' | 'all') => void;
  onClear: () => void;
  onRefresh: () => void;
}

const departments = [
  ['todos', 'Todos os setores'], ['operacao', 'Operação Geral'], ['governanca', 'Governança'],
  ['recepcao', 'Recepção'], ['manutencao', 'Manutenção'], ['cozinha', 'Cozinha'],
];

const selectClass = 'h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none hover:border-slate-300 focus:ring-2 focus:ring-slate-200';

export const KanbanHeaderFilters: React.FC<KanbanHeaderFiltersProps> = props => (
  <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
    {props.canManageArchive && (
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['active', 'archived', 'all'] as const).map(view => (
          <button
            key={view}
            type="button"
            onClick={() => props.onArchiveView(view)}
            className={`h-8 px-3 rounded-lg text-[11px] font-black transition ${props.archiveView === view ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {view === 'active' ? 'Ativos' : view === 'archived' ? 'Arquivados' : 'Todos'}
          </button>
        ))}
      </div>
    )}

    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-[220px] flex-1 max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={props.search} onChange={e => props.onSearch(e.target.value)} placeholder="Buscar título, descrição, quarto ou responsável" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-200" />
      </label>

      <select value={props.department} onChange={e => props.onDepartment(e.target.value)} className={selectClass} aria-label="Filtrar por setor">
        {departments.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>

      <div className="relative">
        <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select value={props.user} onChange={e => props.onUser(e.target.value)} className={`${selectClass} pl-9`} aria-label="Filtrar por responsável">
          <option value="todos">Todos os responsáveis</option><option value="sem_responsavel">Sem responsável</option>
          {props.users.filter(user => user.ativo).map(user => <option key={user.id} value={user.id}>{user.nome}</option>)}
        </select>
      </div>

      <div className="relative">
        <DoorClosed className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select value={props.room} onChange={e => props.onRoom(e.target.value)} className={`${selectClass} pl-9`} aria-label="Filtrar por acomodação">
          <option value="todos">Todas as acomodações</option><option value="sem_quarto">Sem acomodação</option>
          {props.rooms.map(room => <option key={room.id} value={room.numero}>Quarto {room.numero}</option>)}
        </select>
      </div>

      <select value={props.columnId} onChange={e => props.onColumn(e.target.value)} className={selectClass} aria-label="Filtrar por status">
        <option value="todos">Todos os status</option>
        {props.columns.map(column => <option key={column.id} value={column.id}>{column.nome}</option>)}
      </select>

      <select value={props.priority} onChange={e => props.onPriority(e.target.value)} className={selectClass} aria-label="Filtrar por prioridade">
        <option value="todos">Todas as prioridades</option><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
      </select>

      {props.hasFilters && <button type="button" onClick={props.onClear} className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Limpar</button>}
      <button type="button" onClick={props.onRefresh} disabled={props.loading} className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${props.loading ? 'animate-spin' : ''}`} /> Atualizar</button>
      {props.canManageArchive && props.archiveView !== 'active' && <span className="h-10 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" /> Consulta administrativa</span>}
    </div>
  </div>
);
