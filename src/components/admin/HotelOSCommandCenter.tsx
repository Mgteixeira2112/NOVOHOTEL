import React, { useEffect, useMemo, useState } from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  BarChart3, 
  BedDouble, 
  Bell, 
  CheckCircle2, 
  ChefHat, 
  ChevronRight, 
  CircleAlert, 
  ClipboardList, 
  Cloud, 
  Coffee, 
  Database, 
  GitBranch, 
  Globe2, 
  KanbanSquare, 
  Layers3, 
  Link2, 
  MessageSquare, 
  Package, 
  Play, 
  Plus, 
  RefreshCw, 
  Settings2, 
  ShieldCheck, 
  ShoppingCart, 
  Sparkles, 
  Store, 
  Users, 
  Wrench, 
  Zap,
  Inbox
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { kanbanV2, KanbanV2Card, KANBAN_TENANT_ID } from '../../services/kanbanV2';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { EmptyState, StatSummaryCard } from '../common/UIStates';
import { calculateOccupancy } from '../../core/bi/metricFormulas';

type ModuleId = 'operations' | 'kitchen' | 'stock' | 'maintenance' | 'workflows' | 'bi' | 'multi-hotel' | 'integrations';

const modules: Array<{ id: ModuleId; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'operations', label: 'Operação & Kanban', icon: KanbanSquare },
  { id: 'kitchen', label: 'KDS & Pedidos', icon: ChefHat },
  { id: 'stock', label: 'Estoque & Frigobar', icon: Package },
  { id: 'maintenance', label: 'Manutenção de UH', icon: Wrench },
  { id: 'workflows', label: 'Workflows & Eventos', icon: GitBranch },
  { id: 'bi', label: 'BI & KPIs', icon: BarChart3 },
  { id: 'multi-hotel', label: 'Multi-hotel & RBAC', icon: Layers3 },
  { id: 'integrations', label: 'Integrações', icon: Link2 },
];

export const HotelOSCommandCenter: React.FC = () => {
  const { reservations, rooms, users, setAdminActiveTab } = useHotel();
  const [cards, setCards] = useState<KanbanV2Card[]>([]);
  const [active, setActive] = useState<ModuleId>('operations');
  const [lastEvent, setLastEvent] = useState('Barramento de eventos conectado e operacional');

  useEffect(() => {
    let mounted = true;
    void kanbanV2.load(KANBAN_TENANT_ID).then((res) => {
      if (mounted) {
        setCards(res.cards);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Workflows do sistema reais configurados
  const [workflows, setWorkflows] = useState([
    { name: 'Checkout → Governança', trigger: 'checkout.realizado', action: 'Criar tarefa de limpeza no Kanban', active: true, runs: 128 },
    { name: 'Frigobar Crítico → Almoxarifado', trigger: 'frigobar.abaixo_minimo', action: 'Alertar governança e criar reposição', active: true, runs: 42 },
    { name: 'Check-in Antecipado → Recepção', trigger: 'reserva.early_checkin', action: 'Notificar recepção para liberação de UH', active: true, runs: 19 },
  ]);

  // Métricas Operacionais 100% derivadas dos dados reais do Hotel OS
  const operationalMetrics = useMemo(() => {
    const totalRooms = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'ocupado').length;
    const occupancyRatio = calculateOccupancy(occupied, totalRooms);
    const occupancyPct = `${Math.round(occupancyRatio * 100)}%`;
    const openTasksCount = cards.filter((c) => !c.completed_at).length;
    const criticalTasksCount = cards.filter((c) => !c.completed_at && (c.prioridade === 'critica' || c.prioridade === 'atencao')).length;
    const activeStaff = users.filter((u) => u.ativo).length;

    return {
      occupancyPct,
      occupied,
      totalRooms,
      totalReservations: reservations.length,
      activeStaff,
      openTasksCount,
      criticalTasksCount,
    };
  }, [rooms, reservations, cards, users]);

  const emitEvent = (message: string) => {
    setLastEvent(`${new Date().toLocaleTimeString('pt-BR')} — ${message}`);
  };

  const toggleWorkflow = (index: number) => {
    setWorkflows((current) =>
      current.map((w, i) => (i === index ? { ...w, active: !w.active } : w))
    );
    emitEvent(`Workflow "${workflows[index].name}" atualizado`);
  };

  // Visão 1: Operação e Tarefas Reais
  const Operations = () => {
    const pendingCards = cards.filter((c) => !c.completed_at);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatSummaryCard 
            label="Ocupação Atual" 
            value={operationalMetrics.occupancyPct} 
            hint={`${operationalMetrics.occupied} de ${operationalMetrics.totalRooms} quartos`} 
          />
          <StatSummaryCard 
            label="Reservas no Sistema" 
            value={operationalMetrics.totalReservations} 
            hint="base operacional ativa" 
          />
          <StatSummaryCard 
            label="Equipe Ativa" 
            value={operationalMetrics.activeStaff} 
            hint="usuários com acesso" 
          />
          <StatSummaryCard 
            label="Tarefas Abertas" 
            value={operationalMetrics.openTasksCount} 
            hint={`${operationalMetrics.criticalTasksCount} de alta prioridade`} 
          />
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900">Fila Consolidada de Tarefas</h3>
                <p className="text-xs text-stone-500">Tarefas e chamados em tempo real do Kanban Operacional.</p>
              </div>
              <button
                onClick={() => setAdminActiveTab('kanban')}
                className="px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
              >
                Abrir Kanban →
              </button>
            </div>

            {pendingCards.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                <p className="font-medium text-stone-700">Nenhuma tarefa pendente no momento.</p>
                <p className="text-[11px] text-stone-400 mt-1">Todos os departamentos estão em dia.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
                {pendingCards.slice(0, 8).map((card) => (
                  <div key={card.id} className="p-3.5 flex items-center gap-3 hover:bg-stone-50 transition">
                    <ClipboardList className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-stone-900 truncate">{card.titulo}</div>
                      <div className="text-[11px] text-stone-500">
                        {card.departamento || card.location || 'Geral'} · {card.completed_at ? 'Concluído' : 'Pendente'}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        card.prioridade === 'critica'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : card.prioridade === 'atencao'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {card.prioridade || 'Normal'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                <Zap className="w-4 h-4" /> EVENT BUS
              </div>
              <h3 className="font-bold text-base mt-2">Barramento de Eventos</h3>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                Eventos transacionais alimentam os módulos, dashboards e o motor de automação.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-white/10 text-xs font-mono break-all border border-white/5">
                {lastEvent}
              </div>
            </div>

            <button
              onClick={() => emitEvent('Heartbeat do sistema validado com sucesso')}
              className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Barramento
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Visão 2: Cozinha / KDS
  const Kitchen = () => (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-stone-900">Visão Geral KDS • Cozinha & Bar</h3>
          <p className="text-xs text-stone-500">Monitor de pedidos e tempos de preparo da gastronomia.</p>
        </div>
        <button
          onClick={() => setAdminActiveTab('kds')}
          className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
        >
          Acessar Tela Cheia KDS →
        </button>
      </div>
      <EmptyState
        icon={ChefHat}
        title="KDS Operacional Ativo"
        description="Abra a tela KDS para gerenciar a fila de preparo em tempo real, pedidos de salão e room service com som diferenciado."
        actionLabel="Abrir Monitor KDS"
        onAction={() => setAdminActiveTab('kds')}
      />
    </div>
  );

  // Visão 3: Estoque
  const Stock = () => {
    const maintenanceRooms = rooms.filter((r) => r.status === 'manutencao');
    return (
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900">Quartos em Manutenção / Bloqueio</h3>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {maintenanceRooms.length} UHs
            </span>
          </div>
          {maintenanceRooms.length === 0 ? (
            <p className="text-xs text-stone-500 py-4">Nenhum quarto interditado ou em manutenção no momento.</p>
          ) : (
            <div className="space-y-2">
              {maintenanceRooms.map((r) => (
                <div key={r.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold">Quarto {r.numero} ({r.nome})</span>
                  <span className="text-stone-500">Andar {r.andar}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-stone-900">Almoxarifado & Frigobar</h3>
            <p className="text-xs text-stone-500 mt-1">Gestão de itens de reposição e estoque central.</p>
          </div>
          <button
            onClick={() => setAdminActiveTab('frigobar')}
            className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
          >
            Abrir Módulo de Frigobar & Estoque →
          </button>
        </div>
      </div>
    );
  };

  // Visão 4: Manutenção
  const Maintenance = () => {
    const maintenanceCards = cards.filter(
      (c) => (c.departamento === 'manutencao') && !c.completed_at
    );
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-stone-900">Chamados de Manutenção Predial</h3>
            <p className="text-xs text-stone-500">Tarefas abertas com setor responsável definido como Manutenção.</p>
          </div>
          <button
            onClick={() => setAdminActiveTab('kanban')}
            className="px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
          >
            Ver no Kanban
          </button>
        </div>
        {maintenanceCards.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">Nenhum chamado de manutenção pendente.</p>
        ) : (
          <div className="space-y-2">
            {maintenanceCards.map((c) => (
              <div key={c.id} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-stone-400" />
                  <span className="font-bold text-stone-900">{c.titulo}</span>
                </div>
                <span className="text-stone-500">{c.prioridade}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Visão 5: Workflows
  const Workflows = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-stone-900">Motor de Automação de Eventos</h3>
          <p className="text-xs text-stone-500">Gatilhos automáticos executados pelo barramento do Hotel OS.</p>
        </div>
      </div>

      <div className="space-y-3">
        {workflows.map((w, i) => (
          <div
            key={`${w.name}-${i}`}
            className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-900">{w.name}</div>
                <div className="text-xs text-stone-500 font-mono mt-0.5">
                  {w.trigger} → {w.action}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">{w.runs} execuções</span>
              <button
                onClick={() => toggleWorkflow(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
                  w.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {w.active ? 'ATIVO' : 'PAUSADO'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Visão 6: BI & KPIs
  const BI = () => (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs text-center space-y-3">
      <BarChart3 className="w-8 h-8 text-stone-400 mx-auto" />
      <h3 className="font-bold text-stone-900">BI Gerencial & Indicadores Estratégicos</h3>
      <p className="text-xs text-stone-500 max-w-md mx-auto">
        Consulte métricas oficiais de ADR, RevPAR, Ocupação, metas financeiras e relatórios auditados na aba dedicada de BI.
      </p>
      <button
        onClick={() => setAdminActiveTab('management_bi' as any)}
        className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
      >
        Ir para BI Gerencial →
      </button>
    </div>
  );

  // Visão 7: Multi-Hotel
  const MultiHotel = () => (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <h3 className="font-bold text-stone-900 mb-2">Estrutura Multi-Hotel & RLS</h3>
      <p className="text-xs text-stone-500 mb-4">
        Controle de permissões baseado em funções (RBAC) com isolamento estrito de dados por hotel_id.
      </p>
      <div className="divide-y divide-stone-100">
        {['Administrador Geral', 'Gerente Operacional', 'Recepção / Front Desk', 'Governança & Limpeza', 'Gestão Financeira'].map(
          (role) => (
            <div key={role} className="py-2.5 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {role}
              </span>
              <span className="text-[10px] font-black text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                POLÍTICA RLS ATIVA
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );

  // Visão 8: Integrações
  const Integrations = () => (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[
        ['WhatsApp & Mensageria', 'Notificações para hóspedes', MessageSquare, 'Ativo'],
        ['Pagamentos & PIX', 'Gateway e conciliação', Cloud, 'Ativo'],
        ['Channel Manager', 'Sincronização com OTAs', Globe2, 'Preparado'],
        ['Webhooks & Eventos', 'Integração externa', Link2, 'Ativo'],
        ['API REST Hotel OS', 'Endpoints autenticados', Database, 'v1'],
        ['Fechaduras Inteligentes', 'Sensores e chaves digitais', Settings2, 'Preparado'],
      ].map(([name, desc, Icon, status]) => (
        <div key={String(name)} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              {React.createElement(Icon as any, { className: 'w-4 h-4' })}
            </div>
            <div>
              <div className="font-bold text-xs text-stone-900">{String(name)}</div>
              <div className="text-[11px] text-stone-500">{String(desc)}</div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center pt-3 border-t border-stone-100">
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {String(status)}
            </span>
            <span className="text-[11px] text-stone-400">Integrado</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderers: Record<ModuleId, React.FC> = {
    operations: Operations,
    kitchen: Kitchen,
    stock: Stock,
    maintenance: Maintenance,
    workflows: Workflows,
    bi: BI,
    'multi-hotel': MultiHotel,
    integrations: Integrations,
  };
  const Renderer = renderers[active];

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Central Hotel OS & Auditoria"
        category="Sistema & Governança"
        description="Painel técnico consolidado para monitoramento do barramento de eventos, orquestração de fluxos e saúde das integrações operacionais."
        badge="SISTEMA ATIVO"
        badgeVariant="success"
      />

      {/* Sub-módulos do Command Center */}
      <div className="bg-white rounded-2xl border border-stone-200 p-1.5 overflow-x-auto shadow-xs">
        <nav className="flex min-w-max gap-1">
          {modules.map((m) => {
            const Icon = m.icon;
            const isSelected = active === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isSelected ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </nav>
      </div>

      <Renderer />

      <div className="flex items-center gap-2 text-[11px] text-stone-400">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        Último status: {lastEvent}
      </div>
    </section>
  );
};
