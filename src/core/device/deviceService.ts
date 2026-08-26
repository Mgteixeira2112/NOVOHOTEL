export type DeviceType = 'TABLET' | 'POS' | 'DESKTOP' | 'MOBILE' | 'KIOSK' | 'KITCHEN' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'OTHER';
export type DeviceStatus = 'ACTIVE' | 'BLOCKED' | 'REVOKED' | 'MAINTENANCE';

export interface DeviceContext {
  deviceId: string;
  organizationId?: string;
  hotelId: string;
  roomId?: string;
  deviceType: DeviceType;
  appVersion: string;
}

export interface DeviceService {
  bind(context: DeviceContext): void;
  get(): DeviceContext | null;
  clear(): void;
  isCompatible(minVersion?: string): boolean;
}

let currentDevice: DeviceContext | null = null;

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
    currentDevice = { ...context };
  },
  get: () => currentDevice,
  clear: () => { currentDevice = null; },
  isCompatible: (minVersion = '0.0.0') => currentDevice ? compareVersions(currentDevice.appVersion, minVersion) >= 0 : false,
};
