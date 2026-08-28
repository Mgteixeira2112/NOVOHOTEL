import { financialRepository } from './repository';
import type { AddChargeInput, ReceivePaymentInput } from './types';

export const financialEngine = {
  getFolioByStay(stayId: string) {
    if (!stayId) throw new Error('FINANCIAL_STAY_REQUIRED');
    return financialRepository.getFolioByStay(stayId);
  },

  getFolio(folioId: string) {
    if (!folioId) throw new Error('FINANCIAL_FOLIO_REQUIRED');
    return financialRepository.getFolio(folioId);
  },

  addCharge(input: AddChargeInput) {
    if (!input.folioId) throw new Error('FINANCIAL_FOLIO_REQUIRED');
    if (!input.description.trim()) throw new Error('FINANCIAL_DESCRIPTION_REQUIRED');
    if (input.quantity <= 0 || input.unitPrice < 0) throw new Error('FINANCIAL_AMOUNT_INVALID');
    return financialRepository.addCharge(input);
  },

  receivePayment(input: ReceivePaymentInput) {
    if (!input.folioId) throw new Error('FINANCIAL_FOLIO_REQUIRED');
    if (input.amount <= 0) throw new Error('FINANCIAL_PAYMENT_INVALID');
    return financialRepository.receivePayment(input);
  },

  voidCharge(folioItemId: string, reason: string) {
    if (!folioItemId) throw new Error('FINANCIAL_ITEM_REQUIRED');
    if (!reason.trim()) throw new Error('FINANCIAL_VOID_REASON_REQUIRED');
    return financialRepository.voidCharge(folioItemId, reason);
  },

  canCheckout(stayId: string) {
    if (!stayId) throw new Error('FINANCIAL_STAY_REQUIRED');
    return financialRepository.canCheckout(stayId);
  },

  closeFolio(folioId: string) {
    if (!folioId) throw new Error('FINANCIAL_FOLIO_REQUIRED');
    return financialRepository.closeFolio(folioId);
  },
};
