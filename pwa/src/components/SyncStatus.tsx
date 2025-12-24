/**
 * Sync status indicator showing online/offline state.
 */

import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function SyncStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
      isOnline
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-yellow-500'
      }`} />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}
