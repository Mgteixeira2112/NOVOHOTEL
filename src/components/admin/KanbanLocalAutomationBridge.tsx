import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const STORAGE_KEY = 'ITAJUBA_PMS_KANBAN_STORE_V2';
const EVENT_BUS_NAME = 'itajuba_kanban_event';
const KANBAN_TENANT_ID = 'default_hotel';

type LocalCard = Record<string, any> & {
  id: string;
  board_id: string;
  column_id: string;
  titulo: string;
};

interface LocalStoreData {
  cards?: LocalCard[];
}

function safeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function roomNumberOf(card: LocalCard): string | null {
  if (typeof card.room_number === 'string' && card.room_number) return card.room_number;
  const match = typeof card.location === 'string' ? card.location.match(/(\d{2,4})/) : null;
  return match?.[1] || null;
}

function isAutomationCard(card: LocalCard): boolean {
  if (!card?.id || card.id.startsWith('card-init-')) return false;
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata : {};
  return Boolean(
    card.id.startsWith('gov_card_')
    || card.id.startsWith('man_card_')
    || card.id.startsWith('rec_card_')
    || card.id.startsWith('mb_card_')
    || card.id.startsWith('auto-gov-room-')
    || card.id.startsWith('auto-man-room-')
    || card.id.startsWith('auto-res-')
    || card.id.startsWith('auto-minibar-room-')
    || metadata.pms_synced === true
    || metadata.type === 'frigobar_restock'
    || metadata.automation_source === true
    || metadata.automation_type
    || card.reservation_id
  );
}

function canonicalAutomationId(card: LocalCard): string {
  if (typeof card.reservation_id === 'string' && card.reservation_id) {
    return `auto-res-${safeIdPart(card.reservation_id)}`;
  }

  const room = roomNumberOf(card);
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata : {};
  const isMinibar = metadata.type === 'frigobar_restock'
    || metadata.automation_type === 'frigobar_restock'
    || card.id.startsWith('mb_card_')
    || String(card.titulo || '').toLowerCase().includes('frigobar');
  if (room && isMinibar) return `auto-minibar-room-${safeIdPart(room)}`;

  if (room && (card.departamento === 'manutencao' || card.id.startsWith('man_card_'))) {
    return `auto-man-room-${safeIdPart(room)}`;
  }

  const isGovernance = card.id.startsWith('gov_card_')
    || metadata.pms_synced === true
    || metadata.automation_type === 'room_cleaning';
  if (room && card.departamento === 'governanca' && isGovernance) {
    return `auto-gov-room-${safeIdPart(room)}`;
  }

  return card.id;
}

function fingerprint(card: LocalCard): string {
  return JSON.stringify({
    id: canonicalAutomationId(card),
    updated_at: card.updated_at || null,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.titulo,
    prioridade: card.prioridade || null,
    departamento: card.departamento || null,
    room_number: card.room_number || null,
    assigned_to: card.assigned_to || null,
    completed_at: card.completed_at || null,
    is_archived: Boolean(card.is_archived),
    reservation_id: card.reservation_id || null,
    metadata: card.metadata || {},
  });
}

function persistentPayload(card: LocalCard): Record<string, unknown> {
  const now = new Date().toISOString();
  const metadata = card.metadata && typeof card.metadata === 'object'
    ? { ...card.metadata, automation_bridge: true }
    : { automation_bridge: true };

  return {
    id: canonicalAutomationId(card),
    hotel_id: KANBAN_TENANT_ID,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.titulo,
    descricao: card.descricao ?? null,
    prioridade: card.prioridade || 'normal',
    ordem: Number(card.ordem ?? Date.now()),
    departamento: card.departamento ?? null,
    room_number: card.room_number ?? roomNumberOf(card),
    location: card.location ?? null,
    assigned_to: card.assigned_to ?? null,
    checklist: Array.isArray(card.checklist) ? card.checklist : [],
    comments: Array.isArray(card.comments) ? card.comments : [],
    metadata,
    completed_at: card.completed_at ?? null,
    created_at: card.created_at || now,
    updated_at: card.updated_at || now,
    is_archived: Boolean(card.is_archived),
    guest_name: card.guest_name ?? null,
    reservation_id: card.reservation_id ?? null,
    service_details: card.service_details ?? null,
    tags: Array.isArray(card.tags) ? card.tags : [],
    notes: card.notes ?? null,
  };
}

function readInitialSnapshot(): Map<string, string> {
  const snapshot = new Map<string, string>();
  if (typeof localStorage === 'undefined') return snapshot;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return snapshot;
    const parsed = JSON.parse(raw) as LocalStoreData;
    if (!Array.isArray(parsed?.cards)) return snapshot;

    parsed.cards.filter(isAutomationCard).forEach(card => {
      snapshot.set(canonicalAutomationId(card), fingerprint(card));
    });
  } catch {}

  return snapshot;
}

/**
 * Ponte temporária de compatibilidade para os métodos sync* legados do
 * kanbanV2. Não renderiza UI. Apenas alterações reais de cards automáticos
 * no cache local são promovidas ao Supabase, fazendo o Realtime distribuí-las.
 */
export const KanbanLocalAutomationBridge: React.FC = () => {
  const snapshotRef = useRef<Map<string, string>>(new Map());
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    snapshotRef.current = readInitialSnapshot();

    const persistChangedCards = (store: LocalStoreData) => {
      if (!Array.isArray(store?.cards)) return;

      const changed: LocalCard[] = [];
      store.cards.filter(isAutomationCard).forEach(card => {
        const id = canonicalAutomationId(card);
        const nextFingerprint = fingerprint(card);
        if (snapshotRef.current.get(id) === nextFingerprint) return;
        snapshotRef.current.set(id, nextFingerprint);
        changed.push(card);
      });

      if (changed.length === 0) return;

      queueRef.current = queueRef.current.then(async () => {
        for (const card of changed) {
          try {
            const { error } = await supabase
              .from('kanban_cards')
              .upsert(persistentPayload(card), { onConflict: 'id' });
            if (error) console.warn('[KanbanAutomationBridge] Falha ao persistir card automático:', error.message);
          } catch (error) {
            console.warn('[KanbanAutomationBridge] Falha de conexão ao persistir automação:', error);
          }
        }
      });
    };

    const onCustomEvent = (event: Event) => {
      const custom = event as CustomEvent<LocalStoreData>;
      if (custom.detail) persistChangedCards(custom.detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        persistChangedCards(JSON.parse(event.newValue) as LocalStoreData);
      } catch {}
    };

    window.addEventListener(EVENT_BUS_NAME, onCustomEvent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_BUS_NAME, onCustomEvent);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
};
