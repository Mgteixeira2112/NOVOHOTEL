import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, LayoutDashboard, Plus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { dashboardEngine, type DashboardBlock, type DashboardBlockType, type DashboardDefinition, type DashboardMetricResult } from '../../dashboard-engine';
import { tenantService, type TenantSnapshot } from '../../services/tenantService';
import { getOperationalDateRange } from '../../utils/dateHelper';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const BLOCK_TYPES: Array<{ value: DashboardBlockType; label: string }> = [
  { value: 'kpi', label: 'KPI' },
  { value: 'chart', label: 'Gráfico' },
  { value: 'table', label: 'Tabela' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'progress', label: 'Progresso' },
  { value: 'alert', label: 'Alerta' },
];

const WIDTHS = [3, 4, 6, 12];

function formatMetric(result?: DashboardMetricResult) {
  if (!result || result.value == null) return '—';
  const value = Number(result.value);
  if (result.format === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(value) ? value : 0);
  if (result.format === 'percent') return `${((Number.isFinite(value) ? value : 0) * 100).toFixed(1)}%`;
  if (result.format === 'minutes') return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)} min`;
  if (result.format === 'number') return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
  return String(result.value);
}

const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dashboard';

const MetricBlock: React.FC<{ block: DashboardBlock; result?: DashboardMetricResult }> = ({ block, result }) => {
  const numericValue = Number(result?.value ?? 0);
  const percent = result?.format === 'percent' ? Math.max(0, Math.min(100, numericValue * 100)) : 0;
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{block.blockType}</p>
          <h3 className="mt-1 text-xs font-black text-slate-900">{block.title || result?.label || block.metricKey}</h3>
        </div>
        <BarChart3 className="h-4 w-4 text-amber-600" />
      </div>
      {block.blockType === 'table' ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-2 bg-slate-50 px-3 py-2 text-[9px] font-black uppercase text-slate-400"><span>Métrica</span><span className="text-right">Valor</span></div>
          <div className="grid grid-cols-2 px-3 py-3 text-[11px]"><span>{result?.label || block.metricKey}</span><strong className="text-right">{formatMetric(result)}</strong></div>
        </div>
      ) : block.blockType === 'progress' ? (
        <div className="mt-5"><strong className="text-2xl font-black text-slate-900">{formatMetric(result)}</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${percent}%` }} /></div></div>
      ) : block.blockType === 'alert' ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-3"><strong className="text-xl font-black text-amber-900">{formatMetric(result)}</strong><p className="mt-1 text-[10px] text-amber-800">{result?.label || block.metricKey}</p></div>
      ) : (
        <div className="mt-5"><strong className="text-3xl font-black tracking-tight text-slate-900">{formatMetric(result)}</strong><p className="mt-1 text-[10px] text-slate-400">{result?.label || block.metricKey}</p></div>
      )}
    </div>
  );
};

export const DashboardWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const configuredDashboardId = typeof widget.settings?.dashboardId === 'string' ? widget.settings.dashboardId : '';
  const [tenant, setTenant] = useState<TenantSnapshot | null>(null);
  const [hotelId, setHotelId] = useState('');
  const [dashboards, setDashboards] = useState<DashboardDefinition[]>([]);
  const [dashboard, setDashboard] = useState<DashboardDefinition | null>(null);
  const [results, setResults] = useState<Record<string, DashboardMetricResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('Meu Dashboard');
  const [metricKey, setMetricKey] = useState(() => dashboardEngine.listMetrics()[0]?.key || '');
  const [blockType, setBlockType] = useState<DashboardBlockType>('kpi');
  const [blockWidth, setBlockWidth] = useState(4);
  const [preset, setPreset] = useState<'today' | '7d' | '30d' | 'month'>('30d');
  const metrics = useMemo(() => dashboardEngine.listMetrics(), []);
  const canCompose = widget.permissions?.edit !== false;

  useEffect(() => {
    tenantService.getSnapshot().then((snapshot) => {
      setTenant(snapshot);
      setHotelId((current) => current || snapshot?.hotels[0]?.id || '');
    }).catch(() => setError('Não foi possível identificar o hotel autorizado.'));
  }, []);

  const loadDashboards = async (targetHotelId: string) => {
    if (!targetHotelId) return;
    const list = await dashboardEngine.listDashboards(targetHotelId);
    setDashboards(list);
    const preferred = list.find((item) => item.id === configuredDashboardId) || list.find((item) => item.isDefault) || list[0] || null;
    if (preferred) setDashboard(await dashboardEngine.getDashboard(preferred.id));
    else setDashboard(null);
  };

  useEffect(() => {
    if (!hotelId) return;
    setLoading(true); setError('');
    loadDashboards(hotelId).catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar dashboards.')).finally(() => setLoading(false));
  }, [hotelId, configuredDashboardId]);

  const activeRange = useMemo(() => {
    const storedStart = dashboard?.filters?.start;
    const storedEnd = dashboard?.filters?.end;
    return storedStart && storedEnd ? { start: storedStart, end: storedEnd } : getOperationalDateRange(preset);
  }, [dashboard?.id, dashboard?.filters?.start, dashboard?.filters?.end, preset]);

  const resolve = async () => {
    if (!dashboard || !hotelId) return;
    setLoading(true); setError('');
    try {
      const resolved = await dashboardEngine.resolveMetrics(dashboard.blocks.map((block) => block.metricKey), { ...dashboard.filters, hotelId, start: activeRange.start, end: activeRange.end });
      setResults(Object.fromEntries(resolved.map((item) => [item.key, item])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível resolver as métricas.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void resolve(); }, [dashboard?.id, dashboard?.blocks.map((block) => `${block.id}:${block.metricKey}`).join('|'), activeRange.start, activeRange.end, hotelId]);

  const refreshDashboard = async () => {
    if (!dashboard) return;
    setDashboard(await dashboardEngine.getDashboard(dashboard.id));
  };

  const createDashboard = async () => {
    if (!hotelId || !newName.trim()) return;
    setLoading(true); setError('');
    try {
      const created = await dashboardEngine.saveDashboard({ hotelId, name: newName.trim(), slug: `${slugify(newName)}-${Date.now().toString(36)}`, scope: 'PERSONAL', filters: getOperationalDateRange('30d') });
      await loadDashboards(hotelId);
      setDashboard(await dashboardEngine.getDashboard(created.id));
      setEditing(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível criar o dashboard.'); }
    finally { setLoading(false); }
  };

  const addBlock = async () => {
    if (!dashboard || !metricKey) return;
    const maxY = dashboard.blocks.reduce((max, item) => Math.max(max, item.positionY), -1);
    await dashboardEngine.saveBlock({ dashboardId: dashboard.id, blockType, metricKey, positionX: 0, positionY: maxY + 1, width: blockWidth, height: 2 });
    await refreshDashboard();
  };

  const updateBlock = async (block: DashboardBlock, patch: Partial<Pick<DashboardBlock, 'positionY' | 'width'>>) => {
    await dashboardEngine.saveBlock({ dashboardId: block.dashboardId, id: block.id, blockType: block.blockType, metricKey: block.metricKey, title: block.title, positionX: block.positionX, positionY: patch.positionY ?? block.positionY, width: patch.width ?? block.width, height: block.height, config: block.config });
    await refreshDashboard();
  };

  const deleteBlock = async (id: string) => {
    await dashboardEngine.deleteBlock(id);
    await refreshDashboard();
  };

  const selectDashboard = async (id: string) => {
    if (!id) return setDashboard(null);
    setDashboard(await dashboardEngine.getDashboard(id));
  };

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white"><LayoutDashboard className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-slate-900">{widget.title || 'Dashboard'}</h2><p className="text-[10px] text-slate-400">Dashboard Engine · fonte oficial Supabase</p></div></div>
        <div className="flex flex-wrap items-center gap-2">
          {tenant && tenant.hotels.length > 1 && <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold">{tenant.hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select>}
          <select value={dashboard?.id || ''} onChange={(e) => void selectDashboard(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold"><option value="">Selecionar dashboard</option>{dashboards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold"><option value="today">Hoje</option><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="month">Mês</option></select>
          <button onClick={() => void resolve()} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600" title="Atualizar"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
          {canCompose && <button onClick={() => setEditing((value) => !value)} className="flex h-8 items-center gap-1 rounded-xl bg-slate-900 px-3 text-[10px] font-black text-white"><Settings2 className="h-3.5 w-3.5" />Personalizar</button>}
        </div>
      </div>

      {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-bold text-rose-700">{error}</div>}

      {!dashboard && <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center"><LayoutDashboard className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs font-black text-slate-700">Nenhum dashboard configurado</p><p className="mt-1 text-[10px] text-slate-400">Crie um dashboard pessoal e adicione métricas do catálogo oficial.</p>{canCompose && <div className="mx-auto mt-4 flex max-w-sm gap-2"><input value={newName} onChange={(e) => setNewName(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs" /><button onClick={() => void createDashboard()} className="rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-black text-slate-950">Criar</button></div>}</div>}

      {dashboard && editing && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-3"><div className="flex flex-wrap items-end gap-2"><label className="min-w-[220px] flex-1 text-[9px] font-black uppercase text-amber-900">Métrica<select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-2 py-2 text-[10px] normal-case text-slate-700">{metrics.map((metric) => <option key={metric.key} value={metric.key}>{metric.label} · {metric.key}</option>)}</select></label><label className="text-[9px] font-black uppercase text-amber-900">Visual<select value={blockType} onChange={(e) => setBlockType(e.target.value as DashboardBlockType)} className="mt-1 block rounded-xl border border-amber-200 bg-white px-2 py-2 text-[10px] normal-case text-slate-700">{BLOCK_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><label className="text-[9px] font-black uppercase text-amber-900">Largura<select value={blockWidth} onChange={(e) => setBlockWidth(Number(e.target.value))} className="mt-1 block rounded-xl border border-amber-200 bg-white px-2 py-2 text-[10px] normal-case text-slate-700">{WIDTHS.map((width) => <option key={width} value={width}>{width}/12</option>)}</select></label><button onClick={() => void addBlock()} className="flex h-9 items-center gap-1 rounded-xl bg-amber-500 px-3 text-[10px] font-black text-slate-950"><Plus className="h-3.5 w-3.5" />Adicionar bloco</button></div></div>}

      {dashboard && <div className="mt-4 grid grid-cols-12 gap-3">{dashboard.blocks.length === 0 && <div className="col-span-12 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-[10px] text-slate-400">Dashboard vazio. Use “Personalizar” para adicionar o primeiro indicador.</div>}{dashboard.blocks.map((block) => <div key={block.id} style={{ gridColumn: `span ${Math.max(1, Math.min(12, block.width))} / span ${Math.max(1, Math.min(12, block.width))}`, minHeight: `${Math.max(1, block.height) * 80}px` }} className="relative"><MetricBlock block={block} result={results[block.metricKey]} />{editing && <div className="absolute right-2 top-2 flex gap-1 rounded-lg bg-white/95 p-1 shadow"><button onClick={() => void updateBlock(block, { positionY: Math.max(0, block.positionY - 1) })} className="grid h-6 w-6 place-items-center rounded bg-slate-100" title="Subir"><ChevronUp className="h-3 w-3" /></button><button onClick={() => void updateBlock(block, { positionY: block.positionY + 1 })} className="grid h-6 w-6 place-items-center rounded bg-slate-100" title="Descer"><ChevronDown className="h-3 w-3" /></button><button onClick={() => void updateBlock(block, { width: WIDTHS[(WIDTHS.indexOf(block.width) + 1 + WIDTHS.length) % WIDTHS.length] || 4 })} className="grid h-6 w-6 place-items-center rounded bg-slate-100 text-[8px] font-black" title="Redimensionar">W</button><button onClick={() => void deleteBlock(block.id)} className="grid h-6 w-6 place-items-center rounded bg-rose-50 text-rose-700" title="Excluir"><Trash2 className="h-3 w-3" /></button></div>}</div>)}</div>}
    </div>
  );
};
