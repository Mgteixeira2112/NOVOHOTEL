import { hasHotelAccess, hasPermission } from './identity';

export async function requireHotelAccess(hotelId: string): Promise<void> {
  if (!(await hasHotelAccess(hotelId))) {
    throw new Error('Acesso negado ao hotel solicitado');
  }
}

export async function requireHotelPermission(hotelId: string, permission: string): Promise<void> {
  if (!(await hasPermission(hotelId, permission))) {
    throw new Error(`Permissão negada: ${permission}`);
  }
}
