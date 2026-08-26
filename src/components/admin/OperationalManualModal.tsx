import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flame,
  KeyRound,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import {
  HOTEL_OS_OPERATIONAL_MANUALS,
  type RoleManualSection,
} from '../../domain/operationalManualsCore';

interface OperationalManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
}

export const OperationalManualModal: React.FC<OperationalManualModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'GERENTE',
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);

  if (!isOpen) return null;

  const currentManual: RoleManualSection =
    HOTEL_OS_OPERATIONAL_MANUALS[selectedRole] ||
    HOTEL_OS_OPERATIONAL_MANUALS.GERENTE;

  const rolesList = Object.keys(HOTEL_OS_OPERATIONAL_MANUALS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Manuais Operacionais & POPs
              </h2>
              <p className="text-xs text-stone-400">
                Procedimento Operacional Padrão por Perfil de Acesso — HOTEL OS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Selector */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center gap-2 overflow-x-auto">
          {rolesList.map((r) => {
            const manual = HOTEL_OS_OPERATIONAL_MANUALS[r];
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                <span>{manual?.title.split('—')[1]?.trim() || r}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Header Info */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-wider mb-2">
                {currentManual.badge}
              </div>
              <h3 className="text-xl font-black text-stone-900">
                {currentManual.title}
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                {currentManual.description}
              </p>
            </div>
          </div>

          {/* Responsabilidades */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-stone-500" />
              Responsabilidades Principais
            </h4>
            <div className="grid md:grid-cols-2 gap-2.5">
              {currentManual.responsibilities.map((resp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-700 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Procedimento Operacional Padrão */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-stone-500" />
              Procedimentos Operacionais Passo a Passo (POP)
            </h4>
            <div className="space-y-3">
              {currentManual.standardOperatingProcedures.map((sop) => (
                <div
                  key={sop.step}
                  className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center">
                      {sop.step}
                    </span>
                    <h5 className="font-black text-sm text-stone-900">
                      {sop.title}
                    </h5>
                  </div>
                  <p className="text-xs text-stone-600 pl-8">{sop.action}</p>
                  <div className="ml-8 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Regra Crítica:</strong> {sop.criticalRule}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atalhos de Teclado (se houver) */}
          {currentManual.shortcuts && currentManual.shortcuts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                Atalhos Rápidos de Teclado
              </h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {currentManual.shortcuts.map((sc) => (
                  <div
                    key={sc.key}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                  >
                    <span className="text-xs text-stone-600">
                      {sc.description}
                    </span>
                    <kbd className="px-2 py-1 rounded-lg bg-white border border-stone-300 font-mono text-[11px] font-black text-stone-900 shadow-sm">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Protocolos de Incidentes e Contingência */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Protocolos de Incidentes & Contingência
            </h4>
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200 space-y-2">
              {currentManual.incidentProtocols.map((proto, idx) => (
                <div
                  key={idx}
                  className="text-xs text-red-950 flex items-start gap-2"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span>{proto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-medium">
            HOTEL OS Enterprise v2.5 — Homologado para Operação
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors shadow-sm"
          >
            Entendido & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
