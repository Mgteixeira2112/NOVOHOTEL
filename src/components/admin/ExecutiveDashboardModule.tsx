import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, CalendarDays, ChefHat, DollarSign, Gauge, RefreshCw, TrendingUp, Wrench } from 'lucide-react';
import { metricService, type DashboardMetrics } from '../../services/metricService';
import { tenantService, type TenantSnapshot } from '../../services/tenantService';
import { useHotel } from '../../context/HotelContext';

function todayBR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: string, today: string): { start: string; end: string } {
  if (preset === 'yesterday') return { start: shiftDate(today, -1), end: today };
  if (preset === '7d') return { start: shiftDate(today, -6), end: shiftDate(today, 1) };
  if (preset === '30d') return { start: shiftDate(today, -29), end: shiftDate(today, 1) };
  if (preset === 'month') {
    const d = new Date(`${today}T12:00:00`);
    return { start: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, end: shiftDate(today, 1) };
  }
  if (preset === 'previous_month') {
    const d = new Date(`${today}T12:00:00`);
    const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const last = new Date(d.getFullYear(), d.getMonth(), 1);
    return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
  }
  if (preset === 'year') {
    return { start: `${today.slice(0, 4)}-01-01`, end: shiftDate(today, 1) };
  }
  return { start: today, end: shiftDate(today, 1) };
}

const money = (value: number, currency: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL', maximumFractionDigits: 2 }).format(value || 0);
const pct = (value: number) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const number = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0);

const MetricCard: React.FC<{ label: string; value: string; hint?: string; icon: React.ReactNode }> = ({ label, value, hint, icon }) => (
  <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500">{label}</span>
      <span className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">{icon}</span>
    </div>
    <div className="mt-3 text-2xl font-black text-stone-900">{value}</div>
    {hint && <div className="mt-1 text-[11px] text-stone-500">{hint}</div>}
  </div>
);

export const ExecutiveDashboardModule: React.FC = () => {
  const { rooms, reservations, payments } = useHotel();
  const [snapshot, setSnapshot] = useState<TenantSnapshot | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<string>('ALL');
  const [preset, setPreset] = useState('today');
  const [range, setRange] = useState(() => presetRange('today', todayBR()));
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
      const results = await Promise.all(ids.map(async id => [id, await metricService.dashboard(id, range.start, range.end)] as const));
      setMetrics(Object.fromEntries(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as métricas oficiais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [selectedHotel, range.start, range.end, hotelIds.join(',')]);

  const visible: DashboardMetrics[] = Object.values(metrics);
  const aggregate = useMemo<DashboardMetrics | null>(() => {
    if (!visible.length) return null;
    const sum = (key: keyof DashboardMetrics) => visible.reduce((acc, item) => acc + (typeof item[key] === 'number' ? Number(item[key]) : 0), 0);
    const weighted = (key: 'adr' | 'revpar' | 'average_ticket') => {
      const weight = visible.reduce((acc, item) => acc + (key === 'adr' ? item.sold_room_nights ?? 0 : 1), 0);
      return weight ? visible.reduce((acc, item) => acc + Number(item[key] || 0) * (key === 'adr' ? item.sold_room_nights ?? 0 : 1), 0) / weight : 0;
    };
    const first = visible[0];
    return { ...first, occupancy: visible.reduce((a, m) => a + m.occupancy, 0) / visible.length, adr: weighted('adr'), revpar: visible.reduce((a, m) => a + m.revpar, 0) / visible.length, total_revenue: sum('total_revenue'), room_revenue: sum('room_revenue'), pos_revenue: sum('pos_revenue'), room_service_revenue: sum('room_service_revenue'), minibar_revenue: sum('minibar_revenue'), other_service_revenue: sum('other_service_revenue'), average_ticket: weighted('average_ticket'), checkins: sum('checkins'), checkouts: sum('checkouts'), cancellations: sum('cancellations'), no_shows: sum('no_shows'), booking_window: visible.reduce((a,m)=>a+m.booking_window,0)/visible.length, lead_time: visible.reduce((a,m)=>a+m.lead_time,0)/visible.length, housekeeping_productivity: sum('housekeeping_productivity'), housekeeping_avg_minutes: visible.reduce((a,m)=>a+m.housekeeping_avg_minutes,0)/visible.length, maintenance_completed: sum('maintenance_completed'), maintenance_mttr_minutes: visible.reduce((a,m)=>a+m.maintenance_mttr_minutes,0)/visible.length };
  }, [visible]);

  const localFallback = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'ocupado').length;
    const revenue = payments.filter(p => p.status === 'aprovado').reduce((s,p) => s + p.valor, 0);
    return { occupancy: occupied / Math.max(total, 1), revenue, checkins: reservations.filter(r => r.status === 'confirmada').length, checkouts: reservations.filter(r => r.status === 'checkin_realizado').length };
  }, [rooms, payments, reservations]);

  const m = aggregate;
  const hotelName = selectedHotel === 'ALL' ? 'Todos os hotéis autorizados' : snapshot?.hotels.find(h => h.id === selectedHotel)?.name || 'Hotel';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-stone-900">Dashboard Gerencial & BI</h2>
            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">MÉTRICAS OFICIAIS</span>
          </div>
          <p className="text-sm text-stone-500 mt-1">Indicadores centralizados para decisão, com escopo por hotel e organização.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold">
            <option value="ALL">Todos os hotéis autorizados</option>
            {snapshot?.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select value={preset} onChange={e => { const p=e.target.value; setPreset(p); setRange(presetRange(p, todayBR())); }} className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold">
            <option value="today">Hoje</option><option value="yesterday">Ontem</option><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="month">Mês</option><option value="previous_month">Mês anterior</option><option value="year">Ano</option>
          </select>
          <button onClick={() => void load()} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><strong>BI ainda não disponível:</strong> {error}. O painel operacional continua preservado.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard label="Ocupação" value={m ? pct(m.occupancy) : pct(localFallback.occupancy)} hint={m ? `${number(m.checkins)} check-ins no período` : 'fallback operacional local'} icon={<Gauge className="w-4 h-4" />} />
        <MetricCard label="ADR" value={m ? money(m.adr, m.currency) : '—'} hint="somente receita de hospedagem" icon={<BedDouble className="w-4 h-4" />} />
        <MetricCard label="RevPAR" value={m ? money(m.revpar, m.currency) : '—'} hint="receita de hospedagem / quartos disponíveis" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Receita total" value={m ? money(m.total_revenue, m.currency) : money(localFallback.revenue, 'BRL')} hint="sem confundir pagamento com receita" icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Ticket médio" value={m ? money(m.average_ticket, m.currency) : '—'} hint="pedidos POS/restaurante" icon={<ChefHat className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-bold text-stone-900">Reservas</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div><span className="text-[10px] text-stone-500">Check-ins</span><strong className="block text-xl">{m?.checkins ?? localFallback.checkins}</strong></div>
            <div><span className="text-[10px] text-stone-500">Check-outs</span><strong className="block text-xl">{m?.checkouts ?? localFallback.checkouts}</strong></div>
            <div><span className="text-[10px] text-stone-500">Cancelamentos</span><strong className="block text-xl">{m?.cancellations ?? '—'}</strong></div>
            <div><span className="text-[10px] text-stone-500">No-show</span><strong className="block text-xl">{m?.no_shows ?? '—'}</strong></div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500 flex justify-between"><span>Booking window</span><strong>{m ? `${number(m.booking_window)} dias` : '—'}</strong></div>
          <div className="mt-2 text-xs text-stone-500 flex justify-between"><span>Lead time</span><strong>{m ? `${number(m.lead_time)} dias` : '—'}</strong></div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-bold text-stone-900">Receita por setor</h3>
          <div className="space-y-3 mt-4 text-sm">
            <div className="flex justify-between"><span>Hospedagem</span><strong>{m ? money(m.room_revenue,m.currency) : '—'}</strong></div>
            <div className="flex justify-between"><span>PDV</span><strong>{m ? money(m.pos_revenue,m.currency) : '—'}</strong></div>
            <div className="flex justify-between"><span>Room Service</span><strong>{m ? money(m.room_service_revenue,m.currency) : '—'}</strong></div>
            <div className="flex justify-between"><span>Frigobar</span><strong>{m ? money(m.minibar_revenue,m.currency) : '—'}</strong></div>
            <div className="flex justify-between"><span>Outros serviços</span><strong>{m ? money(m.other_service_revenue,m.currency) : '—'}</strong></div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-bold text-stone-900">Operação</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-stone-50 p-3"><BedDouble className="w-4 h-4 text-stone-500"/><strong className="block mt-2 text-xl">{m?.housekeeping_productivity ?? '—'}</strong><span className="text-[10px] text-stone-500">limpezas concluídas</span></div>
            <div className="rounded-xl bg-stone-50 p-3"><Wrench className="w-4 h-4 text-stone-500"/><strong className="block mt-2 text-xl">{m ? `${number(m.maintenance_mttr_minutes)} min` : '—'}</strong><span className="text-[10px] text-stone-500">MTTR</span></div>
            <div className="rounded-xl bg-stone-50 p-3"><CalendarDays className="w-4 h-4 text-stone-500"/><strong className="block mt-2 text-xl">{m ? `${number(m.housekeeping_avg_minutes)} min` : '—'}</strong><span className="text-[10px] text-stone-500">limpeza média</span></div>
            <div className="rounded-xl bg-stone-50 p-3"><AlertTriangle className="w-4 h-4 text-stone-500"/><strong className="block mt-2 text-xl">{m?.maintenance_completed ?? '—'}</strong><span className="text-[10px] text-stone-500">manutenções concluídas</span></div>
          </div>
        </section>
      </div>

      {selectedHotel === 'ALL' && visible.length > 1 && (
        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between"><div><h3 className="font-bold">Comparação entre hotéis</h3><p className="text-xs text-stone-500 mt-1">Somente hotéis autorizados no contexto atual.</p></div><span className="text-[10px] font-bold text-stone-400">RANKING</span></div>
          <div className="overflow-x-auto mt-4"><table className="w-full text-xs"><thead><tr className="text-left text-stone-400 border-b"><th className="py-2">Hotel</th><th>Ocupação</th><th>ADR</th><th>RevPAR</th><th>Receita</th><th>Ticket</th></tr></thead><tbody>{visible.sort((a,b)=>b.revpar-a.revpar).map(item=>{const h=snapshot?.hotels.find(x=>x.id===item.hotel_id);return <tr key={item.hotel_id} className="border-b last:border-0"><td className="py-3 font-bold">{h?.name || item.hotel_id}</td><td>{pct(item.occupancy)}</td><td>{money(item.adr,item.currency)}</td><td>{money(item.revpar,item.currency)}</td><td>{money(item.total_revenue,item.currency)}</td><td>{money(item.average_ticket,item.currency)}</td></tr>})}</tbody></table></div>
        </section>
      )}

      <div className="text-[11px] text-stone-400">Escopo: {hotelName} · {range.start} até {shiftDate(range.end,-1)} · cálculos oficiais centralizados no MetricService/RPC.</div>
    </div>
  );
};
