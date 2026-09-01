import { supabase } from '../lib/supabase';
import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

const EVENT_NAME = 'itajuba_workspace_config_changed';
export const DEFAULT_WORKSPACE_HOTEL_ID = 'default_hotel';

/**
 * Cache efêmero da sessão. Nunca é persistido no navegador.
 * A única fonte persistente de configuração de Workspace é o Supabase.
 */
const overridesByHotel = new Map<string, Record<string, WorkspaceDefinition>>();

const normalizedHotelId = (hotelId?: string) => hotelId || DEFAULT_WORKSPACE_HOTEL_ID;

const replaceMemoryOverrides = (
  hotelId: string,
  overrides: Record<string, WorkspaceDefinition>,
) => {
  overridesByHotel.set(normalizedHotelId(hotelId), overrides);
};

const dispatchWorkspaceConfigChanged = (workspaceId: string, hotelId: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, {
    detail: { workspaceId, hotelId: normalizedHotelId(hotelId) },
  }));
};

/**
 * Leitura síncrona usada pelo registry durante o render.
 * Retorna somente dados já confirmados pelo Supabase e mantidos em memória.
 */
export const loadWorkspaceOverrides = (
  hotelId = DEFAULT_WORKSPACE_HOTEL_ID,
): Record<string, WorkspaceDefinition> =>
  overridesByHotel.get(normalizedHotelId(hotelId)) || {};

export const mergeWorkspaceDefinition = (
  base: WorkspaceDefinition,
  hotelId = DEFAULT_WORKSPACE_HOTEL_ID,
): WorkspaceDefinition => {
  const override = loadWorkspaceOverrides(hotelId)[base.id];
  if (!override) return base;
  return {
    ...base,
    ...override,
    id: base.id,
    widgets: normalizeWorkspaceWidgets(override.widgets || base.widgets),
  };
};

export const hydrateWorkspaceOverridesFromSupabase = async (
  hotelId = DEFAULT_WORKSPACE_HOTEL_ID,
) => {
  const resolvedHotelId = normalizedHotelId(hotelId);

  try {
    const { data, error } = await supabase
      .from('workspace_engine_configs')
      .select('workspace_id, definition')
      .eq('hotel_id', resolvedHotelId);

    if (error) throw error;

    const overrides = Object.fromEntries(
      (data || []).map(row => [
        row.workspace_id,
        {
          ...(row.definition as WorkspaceDefinition),
          widgets: normalizeWorkspaceWidgets((row.definition as WorkspaceDefinition).widgets || []),
        },
      ]),
    );

    replaceMemoryOverrides(resolvedHotelId, overrides);
    return { source: 'supabase' as const, overrides, error: null };
  } catch (error: any) {
    // Mantém apenas o último snapshot confirmado da sessão; não existe fallback persistido no navegador.
    return {
      source: 'local' as const,
      overrides: loadWorkspaceOverrides(resolvedHotelId),
      error: error?.message || 'Não foi possível carregar a configuração do Supabase.',
    };
  }
};

export const saveWorkspaceOverride = async (
  definition: WorkspaceDefinition,
  options?: { hotelId?: string; userId?: string },
) => {
  const hotelId = normalizedHotelId(options?.hotelId);
  const normalized = {
    ...definition,
    widgets: normalizeWorkspaceWidgets(definition.widgets),
  };

  const { error } = await supabase.from('workspace_engine_configs').upsert({
    hotel_id: hotelId,
    workspace_id: definition.id,
    definition: normalized,
    updated_by: options?.userId || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'hotel_id,workspace_id' });

  if (error) return { persisted: false, error: error.message };

  const current = { ...loadWorkspaceOverrides(hotelId), [definition.id]: normalized };
  replaceMemoryOverrides(hotelId, current);
  dispatchWorkspaceConfigChanged(definition.id, hotelId);

  return { persisted: true, error: null };
};

export const resetWorkspaceOverride = async (
  workspaceId: string,
  hotelId = DEFAULT_WORKSPACE_HOTEL_ID,
) => {
  const resolvedHotelId = normalizedHotelId(hotelId);
  const { error } = await supabase
    .from('workspace_engine_configs')
    .delete()
    .eq('hotel_id', resolvedHotelId)
    .eq('workspace_id', workspaceId);

  if (error) return { persisted: false, error: error.message };

  const current = { ...loadWorkspaceOverrides(resolvedHotelId) };
  delete current[workspaceId];
  replaceMemoryOverrides(resolvedHotelId, current);
  dispatchWorkspaceConfigChanged(workspaceId, resolvedHotelId);

  return { persisted: true, error: null };
};

export const subscribeWorkspaceConfig = (listener: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
};
