import { roomDeviceRepository } from '../repositories/roomDeviceRepository';

export async function listarRoomDevices(hotelId: string) {
  return roomDeviceRepository.list(hotelId);
}

export async function iniciarSessaoTablet(deviceId: string, token: string) {
  return roomDeviceRepository.startSession(deviceId, token);
}

export async function resetarTabletAposCheckout(stayId: string) {
  return roomDeviceRepository.resetAfterCheckout(stayId);
}
