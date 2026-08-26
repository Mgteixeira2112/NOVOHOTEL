import { financeRepository } from '../repositories/financeRepository';
export type FinancialAccountType='RECEIVABLE'|'PAYABLE';
export async function settleFinancialAccount(input:{accountType:FinancialAccountType;accountId:string;amount:number;method:string;reference?:string|null;idempotencyKey?:string|null}){if(input.amount<=0)throw new Error('INVALID_FINANCIAL_AMOUNT');if(!input.accountId)throw new Error('ACCOUNT_REQUIRED');return financeRepository.settle(input);}
export function calculateCashDifference(expected:number,counted:number){return Number((counted-expected).toFixed(2));}
export function classifyCashVariance(expected:number,counted:number){const difference=calculateCashDifference(expected,counted);return {difference,type:difference<0?'SHORTAGE':difference>0?'OVERAGE':null};}
export function isOverdue(dueDate:string,status:string,now=new Date()){return ['OPEN','PARTIALLY_PAID'].includes(status)&&new Date(`${dueDate}T23:59:59`).getTime()<now.getTime();}
