import { financialEngine } from '../financial-engine';
import type { FinancialChargeSource, FinancialPaymentMethod } from '../financial-engine';

export type PaymentMethod = FinancialPaymentMethod;

const normalizeSource = (value: string): FinancialChargeSource => {
  const source = String(value || '').trim().toUpperCase() as FinancialChargeSource;
  const allowed: FinancialChargeSource[] = ['ROOM','POS','FRIGOBAR','ROOM_SERVICE','LAUNDRY','MANUAL','TAX','DISCOUNT','ADJUSTMENT'];
  if (!allowed.includes(source)) throw new Error(`FINANCIAL_SOURCE_INVALID:${value}`);
  return source;
};

export async function addFolioItem(input:{folioId:string;category:string;description:string;quantity:number;unitPrice:number;source:string;sourceId?:string|null}) {
  // Compatibilidade pública: consumidores legados continuam recebendo os mesmos códigos.
  if (input.quantity <= 0 || input.unitPrice < 0) throw new Error('INVALID_FOLIO_AMOUNT');
  return financialEngine.addCharge({
    folioId: input.folioId,
    source: normalizeSource(input.source || input.category),
    sourceKey: input.sourceId ?? null,
    description: input.description,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
  });
}

export async function createFolioPayment(input:{folioId:string;amount:number;method:PaymentMethod;transactionReference?:string|null;idempotencyKey?:string|null}) {
  if (input.amount <= 0) throw new Error('INVALID_PAYMENT_AMOUNT');
  return financialEngine.receivePayment({
    folioId: input.folioId,
    amount: input.amount,
    method: input.method,
    externalReference: input.transactionReference ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  });
}

export async function voidFolioItem(folioItemId:string, reason:string) {
  if (!reason.trim()) throw new Error('VOID_REASON_REQUIRED');
  return financialEngine.voidCharge(folioItemId, reason);
}

export async function listFolioPayments(folioId:string) {
  const folio = await financialEngine.getFolio(folioId);
  return folio.payments;
}
