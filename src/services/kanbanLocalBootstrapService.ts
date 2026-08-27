import { canonicalKanbanAutomationId } from '../domain/kanbanAutomation';
import { supabase } from '../lib/supabase';
import { KANBAN_TENANT_ID, KanbanV2Card } from './kanbanV2';

const LEGACY_STORAGE_KEY = 'ITAJUBA_PMS_KANBAN_STORE_V2';
const BOOTSTRAP_MARKER_KEY = 'ITAJUBA_PMS_KANBAN_PRIMARY_BOOTSTRAP_V1';

interface LegacyStore {
  cards?: unknown[];
}

export interface KanbanBootstrapResult {
  attempted: boolean;
  migrated: number;
  skipped: number;
  available: boolean;
  message?: string;
}

function isRealLegacyCard(value: unknown): value is KanbanV2Card {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<KanbanV2Card>;
  if (typeof card.id !== 'string' || !card.id) return false;
  if (card.id.startsWith('card-init-')) return false;
  if (typeof card.board_id !== 'string' || !card.board_id) return false;
  if (typeof card.column_id !== 'string' || !card.column_id) return false;
  if (typeof card.titulo !== 'string' || !card.titulo.trim()) return false;
  return true;
}

function sanitizeLegacyCard(card: KanbanV2Card): Record<string, unknown> {
  const metadata = card.metadata && typeof card.metadata === 'object'
    ? { ...card.metadata, primary_database_bootstrap: true }
    : { primary_database_bootstrap: true };

  return {
    id: canonicalKanbanAutomationId(card),
    hotel_id: KANBAN_TENANT_ID,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.titulo,
    descricao: card.descricao ?? null,
    prioridade: card.prioridade || 'normal',
    ordem: Number(card.ordem ?? Date.now()),
    departamento: card.departamento ?? null,
    room_number: card.room_number ?? null,
    location: card.location ?? null,
    assigned_to: card.assigned_to ?? null,
    checklist: Array.isArray(card.checklist) ? card.checklist : [],
    comments: Array.isArray(card.comments) ? card.comments : [],
    metadata,
    completed_at: card.completed_at ?? null,
    created_at: card.created_at || new Date().toISOString(),
    updated_at: card.updated_at || new Date().toISOString(),
    is_archived: Boolean(card.is_archived),
    guest_name: card.guest_name ?? null,
    reservation_id: card.reservation_id ?? null,
    service_details: card.service_details ?? null,
    tags: Array.isArray(card.tags) ? card.tags : [],
    notes: card.notes ?? null,
  };
}

function readLegacyCards(): KanbanV2Card[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegacyStore;
    return Array.isArray(parsed?.cards) ? parsed.cards.filter(isRealLegacyCard) : [];
  } catch {
    return [];
  }
}

/**
 * Promove somente cards reais que existem no cache legado e ainda não existem
 * no projeto Supabase principal. Automações antigas são normalizadas para IDs
 * determinísticos, evitando duplicidade por reserva/quarto.
 */
export async function bootstrapLegacyKanbanCards(): Promise<KanbanBootstrapResult> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { attempted: false, migrated: 0, skipped: 0, available: true };
  }

  const localCards = readLegacyCards();
  if (localCards.length === 0) {
    localStorage.setItem(BOOTSTRAP_MARKER_KEY, new Date().toISOString());
    return { attempted: true, migrated: 0, skipped: 0, available: true };
  }

  try {
    const { data: remoteRows, error: remoteError } = await supabase
      .from('kanban_cards')
      .select('id')
      .eq('hotel_id', KANBAN_TENANT_ID);

    if (remoteError) {
      return {
        attempted: true,
        migrated: 0,
        skipped: localCards.length,
        available: false,
        message: `Não foi possível verificar o banco principal: ${remoteError.message}`,
      };
    }

    const remoteIds = new Set(
      Array.isArray(remoteRows)
        ? remoteRows.map(row => String(row.id))
        : [],
    );

    const uniqueLocalByCanonicalId = new Map<string, KanbanV2Card>();
    localCards.forEach(card => {
      const id = canonicalKanbanAutomationId(card);
      const previous = uniqueLocalByCanonicalId.get(id);
      if (!previous || String(card.updated_at || '') >= String(previous.updated_at || '')) {
        uniqueLocalByCanonicalId.set(id, card);
      }
    });

    const candidates = Array.from(uniqueLocalByCanonicalId.values());
    const missingCards = candidates.filter(card => !remoteIds.has(canonicalKanbanAutomationId(card)));
    if (missingCards.length === 0) {
      localStorage.setItem(BOOTSTRAP_MARKER_KEY, new Date().toISOString());
      return {
        attempted: true,
        migrated: 0,
        skipped: localCards.length,
        available: true,
      };
    }

    const payload = missingCards.map(sanitizeLegacyCard);
    const { error: insertError } = await supabase
      .from('kanban_cards')
      .upsert(payload, { onConflict: 'id', ignoreDuplicates: true });

    if (insertError) {
      return {
        attempted: true,
        migrated: 0,
        skipped: localCards.length,
        available: false,
        message: `Cards locais preservados, mas ainda não promovidos: ${insertError.message}`,
      };
    }

    localStorage.setItem(BOOTSTRAP_MARKER_KEY, new Date().toISOString());
    return {
      attempted: true,
      migrated: missingCards.length,
      skipped: localCards.length - missingCards.length,
      available: true,
    };
  } catch (error: any) {
    return {
      attempted: true,
      migrated: 0,
      skipped: localCards.length,
      available: false,
      message: String(error?.message || error || 'Falha ao promover cards locais para o banco principal.'),
    };
  }
}
