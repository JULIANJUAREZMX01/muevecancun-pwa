import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRestored(true);
      const t = setTimeout(() => { setShowRestored(false); setWasOffline(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestored) return null;

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-all"
      style={{
        maxWidth: '480px',
        backgroundColor: isOnline ? '#D1FAE5' : '#FEE2E2',
        color: isOnline ? '#065F46' : '#991B1B',
        borderBottom: `2px solid ${isOnline ? '#6EE7B7' : '#FECACA'}`,
      }}
    >
      {isOnline
        ? <><Wifi size={14} /> Conexión restaurada — datos sincronizados</>
        : <><WifiOff size={14} /> Sin conexión — mostrando datos guardados</>
      }
    </div>
  );
}