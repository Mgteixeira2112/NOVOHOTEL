import { supabase } from '../lib/supabase';

export const inventoryRepository = {
  async locations(hotelId: string) { const { data, error } = await supabase.from('hotel_os_stock_locations').select('*').eq('hotel_id', hotelId).order('name'); if (error) throw error; return data ?? []; },
  async stockItems(hotelId: string) { const { data, error } = await supabase.from('hotel_os_stock_items').select('*, product:pdv_produtos(id,nome,status,unidade)').eq('hotel_id', hotelId).order('updated_at',{ascending:false}); if (error) throw error; return data ?? []; },
  async alerts(hotelId: string) { const { data, error } = await supabase.from('hotel_os_stock_alerts').select('*').eq('hotel_id',hotelId); if (error) throw error; return data ?? []; },
  async suppliers(hotelId: string) { const { data, error } = await supabase.from('hotel_os_suppliers').select('*').eq('hotel_id',hotelId).order('name'); if(error) throw error; return data ?? []; },
  async inventories(hotelId: string) { const { data,error }=await supabase.from('hotel_os_inventories').select('*').eq('hotel_id',hotelId).order('created_at',{ascending:false}); if(error) throw error; return data??[]; },
  async move(args: { hotelId:string; productId:string; locationId:string; type:string; quantityDelta:number; unitCost?:number|null; referenceId?:string|null; referenceType?:string|null; }) { const { data,error }=await supabase.rpc('hotel_os_apply_stock_movement',{p_hotel_id:args.hotelId,p_product_id:args.productId,p_location_id:args.locationId,p_type:args.type,p_quantity_delta:args.quantityDelta,p_unit_cost:args.unitCost??null,p_reference_id:args.referenceId??null,p_reference_type:args.referenceType??null}); if(error) throw error; return data as string; },
  async transfer(hotelId:string,productId:string,fromLocation:string,toLocation:string,quantity:number) { const { error }=await supabase.rpc('hotel_os_transfer_stock',{p_hotel_id:hotelId,p_product_id:productId,p_from_location:fromLocation,p_to_location:toLocation,p_quantity:quantity}); if(error) throw error; },
};
