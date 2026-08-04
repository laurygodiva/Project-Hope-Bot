import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useIdentity } from '../context/IdentityContext.jsx';

const EMPTY = { any: false, byCategory: { soporte: false, reporte: false, ck: false } };

export function useTicketsUnread() {
  const { isAdmin } = useIdentity();
  const [summary, setSummary] = useState(EMPTY);

  useEffect(() => {
    if (!isAdmin) return;
    function load() {
      api
        .get('/tickets/unread-summary')
        .then(setSummary)
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  return summary;
}
