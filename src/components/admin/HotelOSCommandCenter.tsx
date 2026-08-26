import React, { useMemo, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, BedDouble, Bell, CheckCircle2, ChefHat, ChevronRight, CircleAlert, ClipboardList, Cloud, Coffee, Database, GitBranch, Globe2, KanbanSquare, Layers3, Link2, MessageSquare, Package, Play, Plus, RefreshCw, Settings2, ShieldCheck, ShoppingCart, Sparkles, Store, Users, Wrench, Zap } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';

type ModuleId = 'operations' | 'kitchen' | 'room-service' | 'stock' | 'maintenance' | 'workflows' | 'bi' | 'multi-hotel' | 'integrations';

const modules: Array<{ id: ModuleId; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'operations', label: 'Operação', icon: KanbanSquare },
  { id: 'kitchen', label: 'KDS / Cozinha', icon: ChefHat },
  { id: 'room-service', label: 'Room Service', icon: Store },
  { id: 'stock', label: 'Estoque & Compras', icon: Package },
  { id: 'maintenance', label: 'Manutenção', icon: Wrench },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'bi', label: 'BI & KPIs', icon: BarChart3 },
  { id: 'multi-hotel', label: 'Multi-hotel', icon: Layers3 },
  { id: 'integrations', label: 'Integrações', icon: Link2 },
];

const seedTasks = [
  { id: 1, title: 'Limpar quarto 204', area: 'Governança', status: 'Em execução', priority: 'Alta' },
  { id: 2, title: 'Trocar fechadura 311', area: 'Manutenção', status: 'Pendente', priority: 'Crítica' },
  { id: 3, title: 'Pedido #1842 — suíte 508', area: 'Cozinha', status: 'Em preparo', priority: 'Normal' },
  { id: 4, title: 'Repor amenities', area: 'Estoque', status: 'Pendente', priority: 'Normal' },
];

const seedWorkflows = [
  { name: 'Checkout → Governança', trigger: 'checkout.realizado', action: 'Criar tarefa de limpeza', active: true, runs: 128 },
  { name: 'Estoque mínimo', trigger: 'estoque.abaixo_minimo', action: 'Criar compra + alertar gerente', active: true, runs: 42 },
  { name: 'NPS crítico', trigger: 'feedback.nps < 7', action: 'Criar follow-up no CRM', active: true, runs: 18 },
];

export const HotelOSCommandCenter: React.FC = () => {
  const { reservations, rooms, users } = useHotel();
  const [active, setActive] = useState<ModuleId>('operations');
  const [tasks, setTasks] = useState(seedTasks);
  const [workflows, setWorkflows] = useState(seedWorkflows);
  const [lastEvent, setLastEvent] = useState('Sistema sincronizado');

  const metrics = useMemo(() => {
    const occupied = rooms.filter((r: any) => ['ocupado', 'reservado'].includes(String(r.status))).length;
    const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
    return [
      { label: 'Ocupação', value: `${occupancy}%`, detail: `${occupied}/${rooms.length} quartos` },
      { label: 'Reservas', value: String(reservations.length), detail: 'base operacional' },
      { label: 'Equipe ativa', value: String(users.filter((u: any) => u.ativo).length), detail: 'usuários ativos' },
      { label: 'Tarefas abertas', value: String(tasks.length), detail: `${tasks.filter(t => t.priority === 'Crítica').length} críticas` },
    ];
  }, [reservations.length, rooms, users, tasks]);

  const emitEvent = (message: string) => setLastEvent(`${new Date().toLocaleTimeString('pt-BR')} — ${message}`);
  const addTask = () => { setTasks(current => [...current, { id: Date.now(), title: 'Nova tarefa operacional', area: 'Operação', status: 'Pendente', priority: 'Normal' }]); emitEvent('Tarefa criada no Kanban'); };
  const toggleWorkflow = (index: number) => { setWorkflows(current => current.map((w, i) => i === index ? { ...w, active: !w.active } : w)); emitEvent('Workflow atualizado'); };

  const Operations = () => <div className="space-y-5"><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{metrics.map(m => <div key={m.label} className="bg-white rounded-2xl border border-stone-200 p-4"><div className="text-xs font-bold text-stone-500">{m.label}</div><div className="text-2xl font-black mt-2">{m.value}</div><div className="text-[11px] text-stone-500 mt-1">{m.detail}</div></div>)}</div><div className="grid lg:grid-cols-[1fr_320px] gap-5"><div className="bg-white rounded-2xl border border-stone-200 overflow-hidden"><div className="p-4 border-b border-stone-100 flex items-center justify-between"><div><h3 className="font-black">Operação em tempo real</h3><p className="text-xs text-stone-500">Fila consolidada dos departamentos.</p></div><button onClick={addTask} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"><Plus className="w-4 h-4 inline mr-1"/>Nova tarefa</button></div><div className="divide-y divide-stone-100">{tasks.map(task => <div key={task.id} className="p-4 flex items-center gap-3"><ClipboardList className="w-4 h-4 text-stone-400"/><div className="flex-1"><div className="font-bold text-sm">{task.title}</div><div className="text-[11px] text-stone-500">{task.area} · {task.status}</div></div><span className={`text-[10px] font-black px-2 py-1 rounded-full ${task.priority === 'Crítica' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-600'}`}>{task.priority}</span><ChevronRight className="w-4 h-4 text-stone-300"/></div>)}</div></div><div className="bg-stone-900 text-white rounded-2xl p-5"><div className="flex items-center gap-2 text-amber-400 text-xs font-black"><Zap className="w-4 h-4"/> EVENT BUS</div><h3 className="font-black text-lg mt-3">Central de eventos</h3><p className="text-xs text-stone-300 mt-2">Eventos podem disparar workflows e atualizar os painéis.</p><div className="mt-5 p-3 rounded-xl bg-white/10 text-xs">{lastEvent}</div><button onClick={() => emitEvent('Heartbeat recebido dos módulos')} className="mt-3 w-full py-2 rounded-xl bg-white/10 text-xs font-bold"><RefreshCw className="w-3.5 h-3.5 inline mr-1"/>Sincronizar</button></div></div></div>;

  const Kitchen = () => <div className="grid lg:grid-cols-3 gap-4">{['Novos pedidos', 'Em preparo', 'Prontos'].map((col, i) => <div key={col} className="bg-white rounded-2xl border border-stone-200 p-4 min-h-64"><div className="flex justify-between mb-4"><h3 className="font-black">{col}</h3><span className="text-xs bg-stone-100 rounded-full px-2 py-1">{[3,5,2][i]}</span></div>{Array.from({length:[3,5,2][i]}).map((_,j)=><div key={j} className="p-3 rounded-xl bg-stone-50 border border-stone-100 mb-2"><div className="font-bold text-sm">Pedido #{1840+j+i*10}</div><div className="text-[11px] text-stone-500">Quarto {200+j}</div></div>)}</div>)}</div>;

  const RoomService = () => <div className="grid md:grid-cols-3 gap-4">{[['Pedidos ativos','12'],['Tempo médio','21 min'],['SLA','94%']].map(([l,v])=><div key={l} className="bg-white rounded-2xl border border-stone-200 p-5"><div className="text-xs font-bold text-stone-500">{l}</div><div className="text-3xl font-black mt-2">{v}</div></div>)}<div className="md:col-span-3 bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Fila de Room Service</h3>{['Café da manhã — 402','Água e amenities — 205','Jantar — 508'].map((x,i)=><div key={x} className="flex gap-3 py-3 border-b last:border-0 border-stone-100"><Bell className="w-4 h-4 text-amber-500"/><span className="font-bold text-sm flex-1">{x}</span><span className="text-xs text-stone-500">{i+8} min</span></div>)}</div></div>;

  const Stock = () => <div className="grid lg:grid-cols-2 gap-5"><div className="bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Estoque crítico</h3>{['Café 500g','Água 500ml','Amenities banho','Toalhas banho'].map((x,i)=><div key={x} className="flex items-center gap-3 py-3 border-b border-stone-100"><Package className="w-4 h-4 text-stone-400"/><span className="font-bold text-sm flex-1">{x}</span><span className="text-xs font-black text-red-600">{[3,8,12,5][i]} un.</span></div>)}<button onClick={()=>emitEvent('Pedido de compra criado')} className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold"><ShoppingCart className="w-4 h-4 inline mr-1"/>Criar compra</button></div><div className="bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Compras</h3>{['PC-1042 · Fornecedor A','PC-1043 · Fornecedor B','PC-1044 · Fornecedor C'].map(x=><div key={x} className="mt-3 p-3 rounded-xl bg-stone-50"><div className="font-bold text-sm">{x}</div><div className="text-[11px] text-stone-500">Aguardando aprovação</div></div>)}</div></div>;

  const Maintenance = () => <div className="grid md:grid-cols-3 gap-4">{[['Críticos','2'],['Em execução','6'],['Aguardando peça','3']].map(([l,v])=><div key={l} className="bg-white rounded-2xl border border-stone-200 p-5"><CircleAlert className="w-5 h-5 text-amber-500"/><div className="text-xs text-stone-500 mt-3">{l}</div><div className="text-3xl font-black">{v}</div></div>)}<div className="md:col-span-3 bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Chamados</h3>{['Ar-condicionado 311','Fechadura 204','Vazamento banheiro 508'].map(x=><div key={x} className="py-3 border-b last:border-0 border-stone-100 flex gap-3"><Wrench className="w-4 h-4"/><span className="font-bold text-sm">{x}</span></div>)}</div></div>;

  const Workflows = () => <div className="space-y-4"><div className="flex justify-between"><div><h3 className="font-black">Workflow Engine</h3><p className="text-xs text-stone-500">Automação orientada a eventos.</p></div><button onClick={()=>setWorkflows(w=>[...w,{name:'Novo workflow',trigger:'evento.manual',action:'Criar tarefa',active:false,runs:0}])} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"><Plus className="w-4 h-4 inline mr-1"/>Novo</button></div>{workflows.map((w,i)=><div key={`${w.name}-${i}`} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 md:items-center"><GitBranch className="w-5 h-5"/><div className="flex-1"><div className="font-black">{w.name}</div><div className="text-xs text-stone-500 mt-1">{w.trigger} → {w.action}</div></div><div className="text-xs text-stone-500">{w.runs} execuções</div><button onClick={()=>toggleWorkflow(i)} className={`px-3 py-2 rounded-xl text-xs font-black ${w.active?'bg-emerald-50 text-emerald-700':'bg-stone-100 text-stone-500'}`}>{w.active?'ATIVO':'PAUSADO'}</button><button onClick={()=>emitEvent(`Teste: ${w.name}`)} className="p-2 rounded-xl border border-stone-200"><Play className="w-4 h-4"/></button></div>)}</div>;

  const BI = () => <div className="space-y-5"><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{[['Ocupação','82%'],['ADR','R$ 385'],['RevPAR','R$ 316'],['NPS','8,9']].map(([l,v])=><div key={l} className="bg-white rounded-2xl border border-stone-200 p-5"><BarChart3 className="w-4 h-4 text-stone-400"/><div className="text-xs text-stone-500 mt-3">{l}</div><div className="text-2xl font-black">{v}</div></div>)}</div><div className="bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Performance operacional</h3>{[['Hospedagem',88],['Restaurante',72],['Governança',94],['Manutenção',81]].map(([l,v])=><div key={String(l)} className="mt-4"><div className="flex justify-between text-xs font-bold"><span>{l}</span><span>{v}%</span></div><div className="h-2 mt-1 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-stone-900" style={{width:`${v}%`}}/></div></div>)}</div></div>;

  const MultiHotel = () => <div className="grid lg:grid-cols-2 gap-5"><div className="bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Grupo hoteleiro</h3>{['Hotel São Paulo','Hotel Rio','Hotel Bahia'].map((h,i)=><div key={h} className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-stone-50"><BedDouble className="w-4 h-4"/><span className="font-bold text-sm flex-1">{h}</span><span className="text-xs font-black">{[88,81,76][i]}%</span><ArrowUpRight className="w-4 h-4 text-stone-400"/></div>)}</div><div className="bg-white rounded-2xl border border-stone-200 p-5"><h3 className="font-black">Acessos</h3>{['Tenant Admin','Gerente Hotel','Recepção','Governança','Financeiro'].map(x=><div key={x} className="py-3 border-b last:border-0 border-stone-100 flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-600"/><span className="font-bold text-sm">{x}</span><span className="ml-auto text-[10px] font-black text-stone-400">RBAC</span></div>)}</div></div>;

  const Integrations = () => <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[['WhatsApp','Mensagens',MessageSquare,'Preparado'],['Pagamentos','PIX / cartões',Cloud,'Preparado'],['Channel Manager','OTAs',Globe2,'Preparado'],['Webhooks','Eventos externos',Link2,'Ativo'],['API Pública','REST',Database,'v1'],['IoT','Fechaduras e sensores',Settings2,'Preparado']].map(([name,desc,Icon,status])=><div key={String(name)} className="bg-white rounded-2xl border border-stone-200 p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">{React.createElement(Icon as any,{className:'w-5 h-5'})}</div><div><div className="font-black">{String(name)}</div><div className="text-[11px] text-stone-500">{String(desc)}</div></div></div><div className="mt-5 flex justify-between items-center"><span className="text-[10px] font-black text-emerald-700">{String(status)}</span><button onClick={()=>emitEvent(`Integração ${String(name)} testada`)} className="text-xs font-bold">Testar →</button></div></div>)}</div>;

  const renderers: Record<ModuleId, React.FC> = { operations: Operations, kitchen: Kitchen, 'room-service': RoomService, stock: Stock, maintenance: Maintenance, workflows: Workflows, bi: BI, 'multi-hotel': MultiHotel, integrations: Integrations };
  const Renderer = renderers[active];

  return <section className="space-y-5"><div className="bg-stone-900 rounded-3xl p-6 text-white"><div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase"><Sparkles className="w-4 h-4"/> Hotel OS Command Center</div><h2 className="text-2xl md:text-3xl font-black mt-2">Central de Operação Inteligente</h2><p className="text-sm text-stone-300 mt-2 max-w-2xl">Operação, automação, BI, integrações e visão multi-hotel em uma única central.</p></div><div className="bg-white rounded-2xl border border-stone-200 p-2 overflow-x-auto"><nav className="flex min-w-max gap-1">{modules.map(m=>{const Icon=m.icon;return <button key={m.id} onClick={()=>setActive(m.id)} className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${active===m.id?'bg-stone-900 text-white':'text-stone-600 hover:bg-stone-100'}`}><Icon className="w-4 h-4"/>{m.label}</button>})}</nav></div><Renderer/><div className="flex items-center gap-2 text-[11px] text-stone-400"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>Último evento: {lastEvent}</div></section>;
};
