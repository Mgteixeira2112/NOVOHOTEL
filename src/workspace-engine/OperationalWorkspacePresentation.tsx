import React, { useMemo } from 'react';
import { WidgetDrivenWorkspace } from './WidgetDrivenWorkspace';
import {
  WorkspaceBackgroundPresetId,
  WorkspaceDefinition,
  WorkspaceWidgetDefinition,
  WorkspaceWidgetHeight,
  WorkspaceWidgetVisualStyle,
  WorkspaceWidgetWidth,
} from './types';

const FINANCIAL_WIDGETS = new Set([
  'stay-finance',
  'financial-summary',
  'financial-transactions',
  'financial-overview',
  'financial-receivables',
  'financial-payables',
]);

const SHORTCUT_WIDGETS = new Set([
  'quick-actions',
  'shortcuts',
  'settings-admin',
  'automation-admin',
  'hotel-os-admin',
]);

const WIDE_WIDGETS = new Set([
  'dashboard',
  'room-map',
  'occupancy-calendar',
  'task-kanban',
  'kanban-cards',
  'financial-overview',
  'financial-transactions',
  'maintenance',
  'orders',
]);

const MEDIUM_WIDGETS = new Set([
  'metrics',
  'financial-summary',
  'financial-receivables',
  'financial-payables',
  'reservations-list',
  'active-stays',
  'guests',
  'team',
  'user-access',
  'frigobar',
]);

const resolveBackgroundPreset = (definition: WorkspaceDefinition): WorkspaceBackgroundPresetId => {
  if (definition.widgets.some(widget => FINANCIAL_WIDGETS.has(widget.type))) return 'finance';
  if (definition.sectors.includes('manutencao') || definition.sectors.includes('cozinha')) return 'service';
  if (definition.sectors.includes('governanca')) return 'operations';
  return 'operations';
};

const defaultWidth = (widget: WorkspaceWidgetDefinition): WorkspaceWidgetWidth => {
  if (WIDE_WIDGETS.has(widget.type)) return 'full';
  if (MEDIUM_WIDGETS.has(widget.type)) return 'medium';
  return 'small';
};

const defaultHeight = (widget: WorkspaceWidgetDefinition): WorkspaceWidgetHeight => {
  if (WIDE_WIDGETS.has(widget.type)) return 'high';
  if (MEDIUM_WIDGETS.has(widget.type)) return 'medium';
  return 'auto';
};

const defaultVisual = (widget: WorkspaceWidgetDefinition): WorkspaceWidgetVisualStyle =>
  widget.type === 'alerts' ? 'highlight' : 'standard';

/**
 * Remove a herança visual antiga dos Workspaces operacionais sem tocar na
 * composição, filtros, ações, permissões ou fontes de dados. O objetivo desta
 * camada é garantir que definições antigas salvas no banco também recebam o
 * novo shell visual; anteriormente os valores legados sobrescreviam o premium.
 */
const withPremiumPresentation = (definition: WorkspaceDefinition): WorkspaceDefinition => ({
  ...definition,
  presentation: {
    ...definition.presentation,
    header: {
      ...definition.presentation?.header,
      showHotel: true,
      showWorkspace: true,
      showDate: true,
      showTime: true,
      showUser: true,
      showStatus: true,
      showOperationalDate: true,
      hourFormat: '24h',
      timezone: 'America/Sao_Paulo',
    },
    surface: {
      ...definition.presentation?.surface,
      backgroundPreset: resolveBackgroundPreset(definition),
      backgroundFit: 'cover',
      backgroundPosition: 'center',
      overlayOpacity: 0.18,
      minHeight: Math.max(900, definition.presentation?.surface?.minHeight || 0),
    },
    sidebar: {
      ...definition.presentation?.sidebar,
      enabled: true,
      x: 2,
      y: 104,
      width: 260,
      itemSize: 'normal',
      visual: 'glass',
    },
    kds: {
      ...definition.presentation?.kds,
      enabled: true,
      orientation: definition.presentation?.kds?.orientation || 'landscape',
      density: definition.presentation?.kds?.density || 'normal',
      viewingDistance: definition.presentation?.kds?.viewingDistance || 'medium',
      realtime: true,
      hideAdministrativeControls: true,
      hideEditingControls: true,
    },
  },
  widgets: definition.widgets.map(widget => ({
    ...widget,
    presentation: {
      ...widget.presentation,
      display: SHORTCUT_WIDGETS.has(widget.type) ? 'button' : 'panel',
      width: defaultWidth(widget),
      height: defaultHeight(widget),
      visual: defaultVisual(widget),
      header: 'compact',
      desktop: {
        ...widget.presentation?.desktop,
        mode: 'auto',
        display: SHORTCUT_WIDGETS.has(widget.type) ? 'button' : 'panel',
        width: defaultWidth(widget),
        height: defaultHeight(widget),
        visual: defaultVisual(widget),
        header: 'compact',
      },
      mobile: {
        mode: 'auto',
        ...widget.presentation?.mobile,
      },
      kds: {
        mode: 'auto',
        ...widget.presentation?.kds,
      },
    },
  })),
});

/**
 * Camada visual premium dos Workspaces operacionais.
 *
 * Não cria engines, fontes de dados ou permissões. A composição continua vindo
 * da Fábrica; esta camada apenas elimina o shell visual legado no runtime.
 */
export const OperationalWorkspacePresentation: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const resolvedDefinition = useMemo(() => withPremiumPresentation(definition), [definition]);
  return <WidgetDrivenWorkspace definition={resolvedDefinition} />;
};
