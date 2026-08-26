export interface DomainEvent<TPayload = Record<string, unknown>> {
  type: string;
  payload: TPayload;
  occurredAt: string;
}

type Handler<TPayload> = (event: DomainEvent<TPayload>) => void | Promise<void>;

const handlers = new Map<string, Set<Handler<any>>>();

export const eventBus = {
  subscribe<TPayload>(type: string, handler: Handler<TPayload>): () => void {
    const set = handlers.get(type) ?? new Set();
    set.add(handler);
    handlers.set(type, set);
    return () => set.delete(handler);
  },

  async publish<TPayload>(type: string, payload: TPayload): Promise<void> {
    const event: DomainEvent<TPayload> = { type, payload, occurredAt: new Date().toISOString() };
    const set = handlers.get(type);
    if (!set) return;
    await Promise.all(Array.from(set).map((handler) => handler(event)));
  },
};
