import React, { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, CircleAlert } from 'lucide-react';
import { metricService, type DashboardAlert } from '../../services/metricService';
import { tenantService } from '../../services/tenantService';

export const DashboardAlertsWidget: React.FC = () => {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  useEffect(() => {
    let active = true;
    tenantService.getSnapshot().then(async snapshot => {
      if (!snapshot) return;
      const results = await Promise.all(snapshot.hotels.map(async hotel => {
        try { await metricService.refreshAlerts(hotel.id); return metricService.alerts(hotel.id); } catch { return []; }
      }));
      if (active) setAlerts(results.flat().sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 12));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5 mt-4">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-bold text-stone-900 flex items-center gap-2"><BellRing className="w-4 h-4" /> Alertas gerenciais</h3><p className="text-xs text-stone-500 mt-1">Alertas derivados dos dados operacionais oficiais.</p></div>
        <span className="text-[10px] font-black text-stone-400">{alerts.length} ATIVOS</span>
      </div>
      <div className="grid md:grid-cols-2 gap-2 mt-4">
        {alerts.length === 0 ? <div className="text-xs text-stone-500 bg-stone-50 rounded-xl p-4">Nenhum alerta ativo no escopo autorizado.</div> : alerts.map(alert => <div key={alert.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3 flex gap-3"><span className={alert.severity==='CRITICAL' ? 'text-red-600' : 'text-amber-600'}>{alert.severity==='CRITICAL' ? <CircleAlert className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}</span><div><div className="text-xs font-bold text-stone-900">{alert.title}</div><div className="text-[11px] text-stone-500 mt-1">{alert.description}</div></div></div>)}
      </div>
    </section>
  );
};
