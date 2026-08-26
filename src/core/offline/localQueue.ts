export type QueueableOperation = {
  id: string;
  operation: string;
  createdAt: number;
  payload: Record<string, unknown>;
};

const KEY = 'hotel-os:offline-queue:v1';
const FORBIDDEN = /payment|pagamento|card|cart[aã]o|refund|estorno|financial|financeiro/i;

let memoryQueue: QueueableOperation[] = [];

function read(): QueueableOperation[] {
  if (typeof localStorage === 'undefined') return memoryQueue;
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueueableOperation[];
  } catch {
    return [];
  }
}

function write(items: QueueableOperation[]) {
  if (typeof localStorage === 'undefined') {
    memoryQueue = items;
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    memoryQueue = items;
  }
}

export const localQueue = {
  enqueue(operation: Omit<QueueableOperation, 'id' | 'createdAt'>) {
    const serialized = JSON.stringify(operation);
    if (FORBIDDEN.test(operation.operation) || FORBIDDEN.test(serialized)) {
      throw new Error('Operação financeira não pode ser enfileirada offline.');
    }
    const item = { ...operation, id: crypto.randomUUID(), createdAt: Date.now() };
    write([...read(), item]);
    return item.id;
  },
  list: read,
  remove(id: string) {
    write(read().filter((item) => item.id !== id));
  },
  clear() {
    write([]);
  },
};
