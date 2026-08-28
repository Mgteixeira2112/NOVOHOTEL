import { supabase } from '../lib/supabase';
import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

const STORAGE_KEY = 'ITAJUBA_WORKSPACE_ENGINE_CONFIG_V2';
const PENDING_SYNC_KEY = 'ITAJUBA_WORKSPACE_ENGINE_PENDING_SYNC_V1';
const EVENT_NAME = 'itajuba_workspace_config_changed';
export const DEFAULT_WORKSPACE_HOTEL_ID = 'default_hotel';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;
const storageKey = (hotelId: string) => `${STORAGE_KEY}:${hotelId || DEFAULT_WORKSPACE_HOTEL_ID}`;
const pendingSyncKey = (hotelId: string) => `${PENDING_SYNC_KEY}:${hotelId || DEFAULT_WORKSPACE_HOTEL_ID}`;

export const loadWorkspaceOverrides = (hotelId = DEFAULT_WORKSPACE_HOTEL_ID): Record<string, WorkspaceDefinition> => {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(storageKey(hotelId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeLocalOverrides = (hotelId: string, overrides: Record<string, WorkspaceDefinition>) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(storageKey(hotelId), JSON.stringify(overrides));
};

const loadPendingSyncIds = (hotelId: string): string[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(pendingSyncKey(hotelId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const setPendingSync = (hotelId: string, workspaceId: string, pending: boolean) => {
  if (!canUseStorage()) return;
  const ids = new Set(loadPendingSyncIds(hotelId));
  if (pending) ids.add(workspaceId);
  else ids.delete(workspaceId);
  window.localStorage.setItem(pendingSyncKey(hotelId), JSON.stringify([...ids]));
};

export const mergeWorkspaceDefinition = (base: WorkspaceDefinition, hotelId = DEFAULT_WORKSPACE_HOTEL_ID): WorkspaceDefinition => {
  const override = loadWorkspaceOverrides(hotelId)[base.id];
  if (!override) return base;
  return { ...base, ...override, id: base.id, widgets: normalizeWorkspaceWidgets(override.widgets || base.widgets) };
};

export const hydrateWorkspaceOverridesFromSupabase = async (hotelId = DEFAULT_WORKSPACE_HOTEL_ID) => {
  try {
    const { data, error } = await supabase
      .from('workspace_engine_configs')
      .select('workspace_id, definition')
      .eq('hotel_id', hotelId);
    if (error) throw error;

    const remoteOverrides = Object.fromEntries((data || []).map(row => [row.workspace_id, row.definition as WorkspaceDefinition]));
    const localOverrides = loadWorkspaceOverrides(hotelId);
    const pendingIds = new Set(loadPendingSyncIds(hotelId));

    // Uma configuração local ainda não confirmada pelo Supabase é mais nova do que
    // a cópia remota conhecida. Não permita que um F5 ressuscite widgets removidos.
    const reconciled = { ...remoteOverrides };
    for (const workspaceId of pendingIds) {
      if (localOverrides[workspaceId]) reconciled[workspaceId] = localOverrides[workspaceId];
    }

    if (Object.keys(reconciled).length > 0) writeLocalOverrides(hotelId, reconciled);
    return {
      source: pendingIds.size > 0 ? 'local' as const : 'supabase' as const,
      overrides: Object.keys(reconciled).length > 0 ? reconciled : localOverrides,
    };
  } catch {
    return { source: 'local' as const, overrides: loadWorkspaceOverrides(hotelId) };
  }
};

export const saveWorkspaceOverride = async (definition: WorkspaceDefinition, options?: { hotelId?: string; userId?: string }) => {
  const hotelId = options?.hotelId || DEFAULT_WORKSPACE_HOTEL_ID;
  const normalized = { ...definition, widgets: normalizeWorkspaceWidgets(definition.widgets) };
  const current = loadWorkspaceOverrides(hotelId);
  current[definition.id] = normalized;
  writeLocalOverrides(hotelId, current);
  setPendingSync(hotelId, definition.id, true);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { workspaceId: definition.id, hotelId } }));

  const { error } = await supabase.from('workspace_engine_configs').upsert({
    hotel_id: hotelId,
    workspace_id: definition.id,
    definition: normalized,
    updated_by: options?.userId || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'hotel_id,workspace_id' });

  if (!error) setPendingSync(hotelId, definition.id, false);
  return { persisted: !error, error: error?.message || null };
};

export const resetWorkspaceOverride = async (workspaceId: string, hotelId = DEFAULT_WORKSPACE_HOTEL_ID) => {
  const current = loadWorkspaceOverrides(hotelId);
  delete current[workspaceId];
  writeLocalOverrides(hotelId, current);
  setPendingSync(hotelId, workspaceId, false);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { workspaceId, hotelId } }));
  const { error } = await supabase.from('workspace_engine_configs').delete().eq('hotel_id', hotelId).eq('workspace_id', workspaceId);
  return { persisted: !error, error: error?.message || null };
};

export const subscribeWorkspaceConfig = (listener: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => { window.removeEventListener(EVENT_NAME, handler); window.removeEventListener('storage', handler); };
};
