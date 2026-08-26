import { folioRepository } from '../repositories/folioRepository';

export type PaymentMethod='CASH'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'BANK_TRANSFER'|'OTHER';
export async function addFolioItem(input:{folioId:string;category:string;description:string;quantity:number;unitPrice:number;source:string;sourceId?:string|null}){if(input.quantity<=0||input.unitPrice<0)throw new Error('INVALID_FOLIO_AMOUNT');return folioRepository.addItem(input);}
export async function createFolioPayment(input:{folioId:string;amount:number;method:PaymentMethod;transactionReference?:string|null;idempotencyKey?:string|null}){if(input.amount<=0)throw new Error('INVALID_PAYMENT_AMOUNT');return folioRepository.createPayment(input);}
export async function voidFolioItem(folioItemId:string,reason:string){if(!reason.trim())throw new Error('VOID_REASON_REQUIRED');return folioRepository.voidItem(folioItemId,reason);}
export async function listFolioPayments(folioId:string){return folioRepository.listPayments(folioId);}
