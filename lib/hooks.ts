import { useState, useEffect } from 'react';

export function useLiveQuery<T>(querier: () => Promise<T>, deps: any[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  const fetchData = async () => {
    try {
      const result = await querier();
      setData(result);
    } catch (error) {
      console.error('useLiveQuery error:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll every 3 seconds for updates (simple way to mimic live query with HTTP)
    const interval = setInterval(fetchData, 3000);

    // Also listen for local updates to trigger immediate refresh
    const handleUpdate = () => fetchData();
    window.addEventListener('db-update-members', handleUpdate);
    window.addEventListener('db-update-forms', handleUpdate);
    window.addEventListener('db-update-settings', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('db-update-members', handleUpdate);
      window.removeEventListener('db-update-forms', handleUpdate);
      window.removeEventListener('db-update-settings', handleUpdate);
    };
  }, deps);

  return data;
}
