import React, { useMemo } from 'react';
import { ArchiveRestore, CalendarClock, DoorClosed, Search, User as UserIcon, X } from 'lucide-react';
import { KanbanV2Column } from '../../services/kanbanV2';
import { buildKanbanTemporalSearch, parseKanbanTemporalSearch } from '../../domain/kanbanFilters';

interface UserOption { id: string; nome: string; ativo: boolean }
interface RoomOption { id: string; numero: string }

interface KanbanHeaderFiltersProps {
  search: string;
  department: string;
  user: string;
  room: string;
  columnId: string;
  priority: string;
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
  onClear: () => void;
  onRefresh?: () => void;
  onOpenArchive?: () => void;
}

const departments = [
  ['todos', 'Todos os setores'], ['operacao', 'Operação Geral'], ['governanca', 'Governança'],
  ['recepcao', 'Recepção'], ['manutencao', 'Manutenção'], ['cozinha', 'Cozinha'],
];

const selectClass = 'h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none hover:border-slate-300 focus:ring-2 focus:ring-slate-200';
const dateClass = 'h-9 min-w-[190px] rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200';

export const KanbanHeaderFilters: React.FC<KanbanHeaderFiltersProps> = props => {
  const parsed = useMemo(() => parseKanbanTemporalSearch(props.search), [props.search]);
  const updateTemporal = (key: keyof typeof parsed.temporal, value: string) => {
    props.onSearch(buildKanbanTemporalSearch(parsed.text, { ...parsed.temporal, [key]: value }));
  };

  return (
    <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={parsed.text} onChange={e => props.onSearch(buildKanbanTemporalSearch(e.target.value, parsed.temporal))} placeholder="Buscar título, descrição, quarto ou responsável" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-200" />
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
          <option value="todos">Todas as prioridades</option><option value="normal">Normal</option><option value="atencao">Atenção</option><option value="critica">Crítica</option>
        </select>

        {props.hasFilters && <button type="button" onClick={props.onClear} className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Limpar</button>}
        {props.canManageArchive && <button type="button" onClick={props.onOpenArchive} className="h-10 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-black text-amber-800 flex items-center gap-1.5"><ArchiveRestore className="w-3.5 h-3.5" /> Arquivo administrativo</button>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 self-center text-[11px] font-black text-slate-600"><CalendarClock className="w-4 h-4" /> Data e hora</div>
        <label className="text-[10px] font-bold text-slate-500 space-y-1"><span className="block">Criado a partir de</span><input type="datetime-local" value={parsed.temporal.createdFrom} onChange={e => updateTemporal('createdFrom', e.target.value)} className={dateClass} /></label>
        <label className="text-[10px] font-bold text-slate-500 space-y-1"><span className="block">Criado até</span><input type="datetime-local" value={parsed.temporal.createdTo} onChange={e => updateTemporal('createdTo', e.target.value)} className={dateClass} /></label>
        <label className="text-[10px] font-bold text-slate-500 space-y-1"><span className="block">Alterado a partir de</span><input type="datetime-local" value={parsed.temporal.updatedFrom} onChange={e => updateTemporal('updatedFrom', e.target.value)} className={dateClass} /></label>
        <label className="text-[10px] font-bold text-slate-500 space-y-1"><span className="block">Alterado até</span><input type="datetime-local" value={parsed.temporal.updatedTo} onChange={e => updateTemporal('updatedTo', e.target.value)} className={dateClass} /></label>
      </div>
    </div>
  );
};
