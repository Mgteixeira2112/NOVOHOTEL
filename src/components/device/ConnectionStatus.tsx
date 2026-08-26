import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const ConnectionStatus: React.FC = () => {
  const status = useOnlineStatus();
  return (
    <div role="status" aria-live="polite" className="fixed bottom-3 left-3 z-50 rounded-full border border-stone-200 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-stone-700 shadow-sm backdrop-blur">
      <span aria-hidden="true" className="mr-1.5">●</span>{status}
    </div>
  );
};
