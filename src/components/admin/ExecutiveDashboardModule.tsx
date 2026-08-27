import React, { useEffect, useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  BedDouble, 
  CalendarDays, 
  ChefHat, 
  DollarSign, 
  Gauge, 
  RefreshCw, 
  TrendingUp, 
  Wrench,
  BarChart3
} from 'lucide-react';
import { metricService, type DashboardMetrics } from '../../services/metricService';
import { tenantService, type TenantSnapshot } from '../../services/tenantService';
import { useHotel } from '../../context/HotelContext';
import { getOperationalTodayStr, getOperationalDateRange } from '../../utils/dateHelper';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { StatSummaryCard } from '../common/UIStates';

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const money = (value: number, currency: string) => 
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: currency || 'BRL', 
    maximumFractionDigits: 2 
  }).format(value || 0);

const pct = (value: number) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const number = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0);

export const ExecutiveDashboardModule: React.FC = () => {
  const { rooms, reservations, payments } = useHotel();
  const [snapshot, setSnapshot] = useState<TenantSnapshot | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<string>('ALL');
  const [preset, setPreset] = useState<'today' | 'yesterday' | '7d' | '30d' | 'month' | 'previous_month' | 'year'>('today');
  const [range, setRange] = useState(() => getOperationalDateRange('today'));
  const [metrics, setMetrics] = useState<Record<string, DashboardMetrics>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tenantService.getSnapshot().then(setSnapshot).catch(() => setSnapshot(null));
  }, []);

  const hotelIds = useMemo(() => snapshot?.hotels.map(h => h.id) || [], [snapshot]);

  const load = async () => {
    if (!hotelIds.length) return;
    setLoading(true);
    setError(null);
    try {
      const ids = selectedHotel === 'ALL' ? hotelIds : [selectedHotel];
      const results = await Promise.all(
        ids.map(async id => [id, await metricService.dashboard(id, range.start, range.end)] as const)
      );
      setMetrics(Object.fromEntries(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as métricas oficiais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    void load(); 
  }, [selectedHotel, range.start, range.end, hotelIds.join(',')]);

  const visible: DashboardMetrics[] = Object.values(metrics);
  const aggregate = useMemo<DashboardMetrics | null>(() => {
    if (!visible.length) return null;
    const sum = (key: keyof DashboardMetrics) => 
      visible.reduce((acc, item) => acc + (typeof item[key] === 'number' ? Number(item[key]) : 0), 0);
    const weighted = (key: 'adr' | 'revpar' | 'average_ticket') => {
      const weight = visible.reduce((acc, item) => acc + (key === 'adr' ? item.sold_room_nights ?? 0 : 1), 0);
      return weight 
        ? visible.reduce((acc, item) => acc + Number(item[key] || 0) * (key === 'adr' ? item.sold_room_nights ?? 0 : 1), 0) / weight 
        : 0;
    };
    const first = visible[0];
    return { 
      ...first, 
      occupancy: visible.reduce((a, m) => a + m.occupancy, 0) / visible.length, 
      adr: weighted('adr'), 
      revpar: visible.reduce((a, m) => a + m.revpar, 0) / visible.length, 
      total_revenue: sum('total_revenue'), 
      room_revenue: sum('room_revenue'), 
      pos_revenue: sum('pos_revenue'), 
      room_service_revenue: sum('room_service_revenue'), 
      minibar_revenue: sum('minibar_revenue'), 
      other_service_revenue: sum('other_service_revenue'), 
      average_ticket: weighted('average_ticket'), 
      checkins: sum('checkins'), 
      checkouts: sum('checkouts'), 
      cancellations: sum('cancellations'), 
      no_shows: sum('no_shows'), 
      booking_window: visible.reduce((a,m)=>a+m.booking_window,0)/visible.length, 
      lead_time: visible.reduce((a,m)=>a+m.lead_time,0)/visible.length, 
      housekeeping_productivity: sum('housekeeping_productivity'), 
      housekeeping_avg_minutes: visible.reduce((a,m)=>a+m.housekeeping_avg_minutes,0)/visible.length, 
      maintenance_completed: sum('maintenance_completed'), 
      maintenance_mttr_minutes: visible.reduce((a,m)=>a+m.maintenance_mttr_minutes,0)/visible.length 
    };
  }, [visible]);

  const localFallback = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'ocupado').length;
    const revenue = payments.filter(p => p.status === 'aprovado').reduce((s,p) => s + p.valor, 0);
    return { 
      occupancy: occupied / Math.max(total, 1), 
      revenue, 
      checkins: reservations.filter(r => r.status === 'confirmada').length, 
      checkouts: reservations.filter(r => r.status === 'checkin_realizado').length 
    };
  }, [rooms, payments, reservations]);

  const m = aggregate;
  const hotelName = selectedHotel === 'ALL' 
    ? 'Todos os hotéis autorizados' 
    : snapshot?.hotels.find(h => h.id === selectedHotel)?.name || 'Hotel';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard Gerencial & BI"
        category="Gestão & Indicadores"
        description="Indicadores analíticos de desempenho hoteleiro (ADR, RevPAR, Ocupação, metas e produtividade) com escopo seguro por organização e hotel."
        badge="MÉTRICAS OFICIAIS"
        badgeVariant="success"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={selectedHotel} 
              onChange={e => setSelectedHotel(e.target.value)} 
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800"
            >
              <option value="ALL">Todos os hotéis autorizados</option>
              {snapshot?.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>

            <select 
              value={preset} 
              onChange={e => { 
                const p = e.target.value as any; 
                setPreset(p); 
                setRange(getOperationalDateRange(p)); 
              }} 
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="month">Mês atual</option>
              <option value="previous_month">Mês anterior</option>
              <option value="year">Ano corrente</option>
            </select>

            <button 
              onClick={() => void load()} 
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-stone-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 
              <span>Atualizar</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <strong>Aviso de Consolidação:</strong> {error}. Exibindo métricas operacionais consolidadas do inventário local.
        </div>
      )}

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatSummaryCard 
          label="Taxa de Ocupação" 
          value={m ? pct(m.occupancy) : pct(localFallback.occupancy)} 
          hint={m ? `${number(m.checkins)} check-ins no período` : 'inventário operacional'} 
          icon={<Gauge className="w-4 h-4" />} 
        />
        <StatSummaryCard 
          label="Diária Média (ADR)" 
          value={m ? money(m.adr, m.currency) : '—'} 
          hint="receita de diárias / diárias vendidas" 
          icon={<BedDouble className="w-4 h-4" />} 
        />
        <StatSummaryCard 
          label="RevPAR" 
          value={m ? money(m.revpar, m.currency) : '—'} 
          hint="receita de diárias / UHs disponíveis" 
          icon={<TrendingUp className="w-4 h-4" />} 
        />
        <StatSummaryCard 
          label="Receita Total" 
          value={m ? money(m.total_revenue, m.currency) : money(localFallback.revenue, 'BRL')} 
          hint="hospedagem, PDV e serviços" 
          icon={<DollarSign className="w-4 h-4" />} 
        />
        <StatSummaryCard 
          label="Ticket Médio PDV" 
          value={m ? money(m.average_ticket, m.currency) : '—'} 
          hint="gastos por comanda/consumo" 
          icon={<ChefHat className="w-4 h-4" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Seção 1: Reservas */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <h3 className="font-bold text-stone-900">Reservas no Período</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">Check-ins</span>
              <strong className="block text-xl text-stone-900 mt-0.5">{m?.checkins ?? localFallback.checkins}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">Check-outs</span>
              <strong className="block text-xl text-stone-900 mt-0.5">{m?.checkouts ?? localFallback.checkouts}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">Cancelamentos</span>
              <strong className="block text-xl text-stone-900 mt-0.5">{m?.cancellations ?? '—'}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500">No-show</span>
              <strong className="block text-xl text-stone-900 mt-0.5">{m?.no_shows ?? '—'}</strong>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500 flex justify-between">
            <span>Janela de Reserva (Booking Window)</span>
            <strong>{m ? `${number(m.booking_window)} dias` : '—'}</strong>
          </div>
          <div className="mt-2 text-xs text-stone-500 flex justify-between">
            <span>Antecedência Média (Lead Time)</span>
            <strong>{m ? `${number(m.lead_time)} dias` : '—'}</strong>
          </div>
        </section>

        {/* Seção 2: Receita por Centro de Custo */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <h3 className="font-bold text-stone-900">Receita por Centro de Resultado</h3>
          <div className="space-y-3 mt-4 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Hospedagem & Diárias</span>
              <strong className="text-stone-900">{m ? money(m.room_revenue, m.currency) : '—'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Restaurante & PDV</span>
              <strong className="text-stone-900">{m ? money(m.pos_revenue, m.currency) : '—'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Room Service</span>
              <strong className="text-stone-900">{m ? money(m.room_service_revenue, m.currency) : '—'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Frigobar de Quartos</span>
              <strong className="text-stone-900">{m ? money(m.minibar_revenue, m.currency) : '—'}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-600">Outros Serviços</span>
              <strong className="text-stone-900">{m ? money(m.other_service_revenue, m.currency) : '—'}</strong>
            </div>
          </div>
        </section>

        {/* Seção 3: Produtividade Operacional */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <h3 className="font-bold text-stone-900">Governança & Manutenção</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-stone-50 p-3">
              <BedDouble className="w-4 h-4 text-stone-500" />
              <strong className="block mt-2 text-xl text-stone-900">{m?.housekeeping_productivity ?? '—'}</strong>
              <span className="text-[10px] text-stone-500">limpezas realizadas</span>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <Wrench className="w-4 h-4 text-stone-500" />
              <strong className="block mt-2 text-xl text-stone-900">{m ? `${number(m.maintenance_mttr_minutes)} min` : '—'}</strong>
              <span className="text-[10px] text-stone-500">MTTR manutenção</span>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <CalendarDays className="w-4 h-4 text-stone-500" />
              <strong className="block mt-2 text-xl text-stone-900">{m ? `${number(m.housekeeping_avg_minutes)} min` : '—'}</strong>
              <span className="text-[10px] text-stone-500">tempo médio limpeza</span>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <AlertTriangle className="w-4 h-4 text-stone-500" />
              <strong className="block mt-2 text-xl text-stone-900">{m?.maintenance_completed ?? '—'}</strong>
              <span className="text-[10px] text-stone-500">chamados concluídos</span>
            </div>
          </div>
        </section>
      </div>

      {selectedHotel === 'ALL' && visible.length > 1 && (
        <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-stone-900">Comparativo Consolidado entre Hotéis</h3>
              <p className="text-xs text-stone-500">Somente hotéis e unidades autorizados para a sua credencial.</p>
            </div>
            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">RANKING OFICIAL</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-stone-400 border-b border-stone-100">
                  <th className="py-2.5 font-bold">Hotel</th>
                  <th className="font-bold">Ocupação</th>
                  <th className="font-bold">ADR</th>
                  <th className="font-bold">RevPAR</th>
                  <th className="font-bold">Receita</th>
                  <th className="font-bold">Ticket Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.sort((a, b) => b.revpar - a.revpar).map(item => {
                  const h = snapshot?.hotels.find(x => x.id === item.hotel_id);
                  return (
                    <tr key={item.hotel_id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 font-bold text-stone-900">{h?.name || item.hotel_id}</td>
                      <td className="text-stone-700">{pct(item.occupancy)}</td>
                      <td className="text-stone-700">{money(item.adr, item.currency)}</td>
                      <td className="text-stone-700 font-bold">{money(item.revpar, item.currency)}</td>
                      <td className="text-stone-700">{money(item.total_revenue, item.currency)}</td>
                      <td className="text-stone-700">{money(item.average_ticket, item.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="text-[11px] text-stone-400">
        Escopo: {hotelName} · Período: {range.start} até {shiftDate(range.end, -1)} · Métricas auditadas centralizadas via MetricService.
      </div>
    </div>
  );
};
