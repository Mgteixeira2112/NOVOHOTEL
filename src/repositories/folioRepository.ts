import { supabase } from '../lib/supabase';

export const folioRepository={
 async addItem(input:{folioId:string;category:string;description:string;quantity:number;unitPrice:number;source:string;sourceId?:string|null}){const {data,error}=await supabase.rpc('hotel_os_add_folio_item',{p_folio_id:input.folioId,p_category:input.category,p_description:input.description,p_quantity:input.quantity,p_unit_price:input.unitPrice,p_source:input.source,p_source_id:input.sourceId??null});if(error)throw error;return String(data);},
 async createPayment(input:{folioId:string;amount:number;method:'CASH'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'BANK_TRANSFER'|'OTHER';transactionReference?:string|null;idempotencyKey?:string|null}){const {data,error}=await supabase.rpc('hotel_os_create_payment',{p_folio_id:input.folioId,p_amount:input.amount,p_method:input.method,p_transaction_reference:input.transactionReference??null,p_idempotency_key:input.idempotencyKey??null});if(error)throw error;return String(data);},
 async voidItem(folioItemId:string,reason:string){const {data,error}=await supabase.rpc('hotel_os_void_folio_item',{p_folio_item_id:folioItemId,p_reason:reason});if(error)throw error;return String(data);},
 async listPayments(folioId:string){const {data,error}=await supabase.from('hotel_os_payments').select('*').eq('folio_id',folioId).order('created_at',{ascending:false});if(error)throw error;return data??[];},
};
