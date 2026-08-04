import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useIdentity } from '../context/IdentityContext.jsx';

const EMPTY = { any: false, byCategory: { soporte: false, reporte: false, ck: false, playmaker: false } };

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
    const interval = setInterval(load, 4000);

    function onVisible() {
      if (document.visibilityState === 'visible') load();
    }
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', load);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', load);
    };
  }, [isAdmin]);

  return summary;
}
