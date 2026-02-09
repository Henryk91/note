import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../core/store';
import { flushQueue } from '../../offlineQueue/queue';

export function useOfflineSync() {
  const authToken = useSelector((state: RootState) => state.person.authToken);

  useEffect(() => {
    const runFlush = () => {
      // Only flush queue if online AND logged in
      if (navigator.onLine && authToken) {
        void flushQueue();
      }
    };

    // Try once on mount (or when auth/online status changes)
    runFlush();

    window.addEventListener('online', runFlush);
    return () => {
      window.removeEventListener('online', runFlush);
    };
  }, [authToken]);
}
