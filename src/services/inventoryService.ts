import { inventoryRepository } from '../repositories/inventoryRepository';

export async function getInventoryDashboard(hotelId:string){ const [items,alerts]=await Promise.all([inventoryRepository.stockItems(hotelId),inventoryRepository.alerts(hotelId)]); const value=items.reduce((s:any,i:any)=>s+Number(i.quantity||0)*Number(i.average_cost||0),0); return {items,alerts,summary:{totalItems:items.length,lowStock:alerts.filter((a:any)=>a.alert_type==='LOW_STOCK').length,outOfStock:alerts.filter((a:any)=>a.alert_type==='OUT_OF_STOCK').length,estimatedValue:value}}; }
export const listStockLocations=inventoryRepository.locations;
export const listSuppliers=inventoryRepository.suppliers;
export const listInventories=inventoryRepository.inventories;
export const registerStockMovement=inventoryRepository.move;
export const transferStock=inventoryRepository.transfer;
