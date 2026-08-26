import { useEffect, useState } from 'react';

export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCHRONIZING';

export function useOnlineStatus(): ConnectionState {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  return online ? 'ONLINE' : 'OFFLINE';
}
