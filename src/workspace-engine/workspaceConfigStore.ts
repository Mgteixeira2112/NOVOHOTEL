import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

const STORAGE_KEY = 'ITAJUBA_WORKSPACE_ENGINE_CONFIG_V1';
const EVENT_NAME = 'itajuba_workspace_config_changed';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const loadWorkspaceOverrides = (): Record<string, WorkspaceDefinition> => {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const mergeWorkspaceDefinition = (base: WorkspaceDefinition): WorkspaceDefinition => {
  const override = loadWorkspaceOverrides()[base.id];
  if (!override) return base;
  return { ...base, ...override, id: base.id, widgets: normalizeWorkspaceWidgets(override.widgets || base.widgets) };
};

export const saveWorkspaceOverride = (definition: WorkspaceDefinition) => {
  if (!canUseStorage()) return;
  const current = loadWorkspaceOverrides();
  current[definition.id] = { ...definition, widgets: normalizeWorkspaceWidgets(definition.widgets) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { workspaceId: definition.id } }));
};

export const resetWorkspaceOverride = (workspaceId: string) => {
  if (!canUseStorage()) return;
  const current = loadWorkspaceOverrides();
  delete current[workspaceId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { workspaceId } }));
};

export const subscribeWorkspaceConfig = (listener: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => { window.removeEventListener(EVENT_NAME, handler); window.removeEventListener('storage', handler); };
};
