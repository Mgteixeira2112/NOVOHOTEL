import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  canonicalKanbanAutomationId,
  isKanbanAutomationCard,
  kanbanAutomationRoomNumber,
} from '../../domain/kanbanAutomation';

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
  boards?: unknown[];
  columns?: unknown[];
}

function fingerprint(card: LocalCard): string {
  return JSON.stringify({
    id: canonicalKanbanAutomationId(card),
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
    id: canonicalKanbanAutomationId(card),
    hotel_id: KANBAN_TENANT_ID,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.titulo,
    descricao: card.descricao ?? null,
    prioridade: card.prioridade || 'normal',
    ordem: Number(card.ordem ?? Date.now()),
    departamento: card.departamento ?? null,
    room_number: card.room_number ?? kanbanAutomationRoomNumber(card),
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

    parsed.cards.filter(isKanbanAutomationCard).forEach(card => {
      snapshot.set(canonicalKanbanAutomationId(card), fingerprint(card));
    });
  } catch {}

  return snapshot;
}

function mirrorCardIntoLocalRealtime(card: LocalCard) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) as LocalStoreData : { boards: [], columns: [], cards: [] };
    const cards = Array.isArray(store.cards) ? store.cards : [];
    store.cards = [...cards.filter(item => String(item.id) !== String(card.id)), card];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVENT_BUS_NAME, { detail: store }));
  } catch {}
}

async function refreshGovernanceCardForRoom(row: any) {
  const roomId = row?.id ? String(row.id) : '';
  const roomNumber = row?.numero ? String(row.numero) : '';
  if (!roomId && !roomNumber) return;

  let query = supabase
    .from('kanban_cards')
    .select('*')
    .eq('hotel_id', KANBAN_TENANT_ID)
    .eq('board_id', 'kanban-board-governanca')
    .eq('is_archived', false)
    .limit(1);

  query = roomId ? query.eq('room_id', roomId) : query.eq('room_number', roomNumber);
  const { data, error } = await query.maybeSingle();
  if (!error && data) mirrorCardIntoLocalRealtime(data as LocalCard);
}

/**
 * Ponte temporária de compatibilidade para os métodos sync* legados do
 * kanbanV2. Não renderiza UI. Além das automações locais, espelha alterações
 * de quarto para o card canônico da Governança no event bus já consumido pelo
 * runtime Kanban. O motor permanece intocado.
 */
export const KanbanLocalAutomationBridge: React.FC = () => {
  const snapshotRef = useRef<Map<string, string>>(new Map());
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    snapshotRef.current = readInitialSnapshot();

    const persistChangedCards = (store: LocalStoreData) => {
      if (!Array.isArray(store?.cards)) return;

      const changed: LocalCard[] = [];
      store.cards.filter(isKanbanAutomationCard).forEach(card => {
        const id = canonicalKanbanAutomationId(card);
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

    const roomChannel = supabase
      .channel(`governanca-room-projection-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quartos' }, payload => {
        const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
        void refreshGovernanceCardForRoom(row);
      })
      .subscribe();

    return () => {
      window.removeEventListener(EVENT_BUS_NAME, onCustomEvent);
      window.removeEventListener('storage', onStorage);
      void supabase.removeChannel(roomChannel);
    };
  }, []);

  return null;
};
