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

const withPremiumPresentation = (definition: WorkspaceDefinition): WorkspaceDefinition => ({
  ...definition,
  presentation: {
    ...definition.presentation,
    header: {
      showHotel: true,
      showWorkspace: true,
      showDate: true,
      showTime: true,
      showUser: true,
      showStatus: true,
      showOperationalDate: true,
      hourFormat: '24h',
      timezone: 'America/Sao_Paulo',
      ...definition.presentation?.header,
    },
    surface: {
      backgroundPreset: resolveBackgroundPreset(definition),
      backgroundFit: 'cover',
      backgroundPosition: 'center',
      overlayOpacity: 0.16,
      minHeight: 820,
      ...definition.presentation?.surface,
    },
    sidebar: {
      enabled: true,
      x: 2,
      y: 110,
      width: 250,
      itemSize: 'normal',
      visual: 'glass',
      ...definition.presentation?.sidebar,
    },
    kds: {
      enabled: true,
      orientation: 'landscape',
      density: 'normal',
      viewingDistance: 'medium',
      realtime: true,
      hideAdministrativeControls: true,
      hideEditingControls: true,
      ...definition.presentation?.kds,
    },
  },
  widgets: definition.widgets.map(widget => ({
    ...widget,
    presentation: {
      display: SHORTCUT_WIDGETS.has(widget.type) ? 'button' : 'panel',
      width: defaultWidth(widget),
      height: defaultHeight(widget),
      visual: defaultVisual(widget),
      header: 'compact',
      ...widget.presentation,
      desktop: {
        mode: 'auto',
        ...widget.presentation?.desktop,
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
 * Camada visual padrão dos Workspaces operacionais.
 *
 * Não cria engines, fontes de dados ou permissões. Ela apenas completa valores
 * de apresentação ausentes e preserva qualquer configuração já salva pela
 * Fábrica de Workspaces.
 */
export const OperationalWorkspacePresentation: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const resolvedDefinition = useMemo(() => withPremiumPresentation(definition), [definition]);
  return <WidgetDrivenWorkspace definition={resolvedDefinition} />;
};
