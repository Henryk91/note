import { useEffect } from 'react';
import { flushQueue } from '../../offlineQueue/queue';

export function useOfflineSync() {
  useEffect(() => {
    const runFlush = () => {
      // Only flush queue if online AND logged in
      const loginKey = localStorage.getItem('loginKey');
      if (navigator.onLine && loginKey) {
        void flushQueue();
      }
    };

    // Try once on mount (in case we're already online and have a backlog)
    runFlush();

    window.addEventListener('online', runFlush);
    return () => {
      window.removeEventListener('online', runFlush);
    };
  }, []);
}
