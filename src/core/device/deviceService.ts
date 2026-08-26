export type CanonicalDeviceType = 'POS' | 'TABLET_ROOM' | 'KDS' | 'TOTEM' | 'MOBILE';
export type DeviceType =
  | CanonicalDeviceType
  | 'TABLET'
  | 'DESKTOP'
  | 'KIOSK'
  | 'KITCHEN'
  | 'HOUSEKEEPING'
  | 'MAINTENANCE'
  | 'OTHER';

export type DeviceStatus = 'ACTIVE' | 'BLOCKED' | 'REVOKED' | 'MAINTENANCE';

export interface DeviceContext {
  deviceId: string;
  organizationId?: string;
  hotelId: string;
  roomId?: string | null;
  deviceType: DeviceType;
  appVersion: string;
  activeStayId?: string | null;
  status?: DeviceStatus;
  lastSeenAt?: string | null;
}

export interface RegisteredDevice {
  id: string;
  hotel_id: string;
  room_id?: string | null;
  device_type: DeviceType;
  name: string;
  status: DeviceStatus;
  active: boolean;
  last_seen_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
}

export interface DeviceService {
  bind(context: DeviceContext): void;
  get(): DeviceContext | null;
  clear(): void;
  isCompatible(minVersion?: string): boolean;
  register(device: Omit<RegisteredDevice, 'id' | 'status' | 'active'>): RegisteredDevice;
  activate(deviceId: string): void;
  revoke(deviceId: string): void;
  updateLastSeen(deviceId: string): void;
  bindTabletToRoom(deviceId: string, roomId: string, stayId?: string): void;
  onRoomCheckout(roomId: string): { invalidated: boolean; previousStayId: string | null };
  isRoomAuthorized(requestedRoomId: string): boolean;
}

let currentDevice: DeviceContext | null = null;
const registeredDevicesMap = new Map<string, RegisteredDevice>();

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const x = left[i] ?? 0;
    const y = right[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

export const deviceService: DeviceService = {
  bind(context) {
    if (!context.deviceId || !context.hotelId) throw new Error('Dispositivo sem contexto válido.');
    if (context.status === 'REVOKED' || context.status === 'BLOCKED') {
      throw new Error('Dispositivo revogado ou bloqueado.');
    }
    const registered = registeredDevicesMap.get(context.deviceId);
    if (registered && (registered.status === 'REVOKED' || registered.status === 'BLOCKED' || !registered.active)) {
      throw new Error('Dispositivo revogado ou bloqueado no registro.');
    }
    currentDevice = {
      ...context,
      roomId: context.roomId ?? null,
      status: context.status ?? 'ACTIVE',
      lastSeenAt: context.lastSeenAt ?? new Date().toISOString(),
    };
  },
  get: () => currentDevice,
  clear: () => {
    currentDevice = null;
  },
  isCompatible: (minVersion = '0.0.0') =>
    currentDevice ? compareVersions(currentDevice.appVersion, minVersion) >= 0 : false,

  register(device) {
    const id = crypto.randomUUID();
    const newDevice: RegisteredDevice = {
      ...device,
      id,
      status: 'ACTIVE',
      active: true,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };
    registeredDevicesMap.set(id, newDevice);
    return newDevice;
  },

  activate(deviceId: string) {
    const d = registeredDevicesMap.get(deviceId);
    if (d) {
      d.status = 'ACTIVE';
      d.active = true;
      d.revoked_at = null;
      d.last_seen_at = new Date().toISOString();
    }
    if (currentDevice && currentDevice.deviceId === deviceId) {
      currentDevice.status = 'ACTIVE';
    }
  },

  revoke(deviceId: string) {
    const d = registeredDevicesMap.get(deviceId);
    if (d) {
      d.status = 'REVOKED';
      d.active = false;
      d.revoked_at = new Date().toISOString();
    }
    if (currentDevice && currentDevice.deviceId === deviceId) {
      currentDevice.status = 'REVOKED';
    }
  },

  updateLastSeen(deviceId: string) {
    const now = new Date().toISOString();
    const d = registeredDevicesMap.get(deviceId);
    if (d) d.last_seen_at = now;
    if (currentDevice && currentDevice.deviceId === deviceId) {
      currentDevice.lastSeenAt = now;
    }
  },

  bindTabletToRoom(deviceId: string, roomId: string, stayId?: string) {
    const d = registeredDevicesMap.get(deviceId);
    if (d) {
      d.room_id = roomId;
    }
    if (currentDevice && currentDevice.deviceId === deviceId) {
      currentDevice.roomId = roomId;
      currentDevice.activeStayId = stayId ?? null;
    }
  },

  onRoomCheckout(roomId: string) {
    let invalidated = false;
    let previousStayId: string | null = null;

    if (currentDevice && currentDevice.roomId === roomId) {
      previousStayId = currentDevice.activeStayId ?? null;
      currentDevice.activeStayId = null;
      invalidated = true;
    }

    return { invalidated, previousStayId };
  },

  isRoomAuthorized(requestedRoomId: string): boolean {
    if (!currentDevice) return true; // non-device context (e.g. backend / admin desktop)
    if (currentDevice.deviceType !== 'TABLET_ROOM' && currentDevice.deviceType !== 'TABLET') {
      return true; // only room tablets are restricted to a single room
    }
    if (!currentDevice.roomId) return false;
    return currentDevice.roomId === requestedRoomId;
  },
};
