import React, { createContext, useContext, useMemo, useState } from 'react';
import type { HotelDevice } from './identity';

interface DeviceContextValue {
  device: HotelDevice | null;
  setDevice: (device: HotelDevice | null) => void;
  clearDeviceSession: () => void;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export const DeviceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [device, setDevice] = useState<HotelDevice | null>(null);

  const value = useMemo<DeviceContextValue>(
    () => ({
      device,
      setDevice,
      clearDeviceSession: () => setDevice(null),
    }),
    [device],
  );

  return React.createElement(DeviceContext.Provider, { value }, children);
};

export function useDevice() {
  const value = useContext(DeviceContext);
  if (!value) {
    throw new Error('useDevice deve ser utilizado dentro de DeviceProvider');
  }
  return value;
}
