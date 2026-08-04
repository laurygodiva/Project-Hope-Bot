import { createContext, useContext, useEffect, useState } from 'react';
import { discordSdk, ensureReady } from '../discord/sdk.js';
import { api, setAuthToken } from '../api/client.js';

const IdentityContext = createContext(null);

export function IdentityProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    phase: 'authorizing',
    user: null,
    isAdmin: false,
    isSanctionsManager: false,
    isFounder: false,
    error: null,
    guild: null,
    viewMode: 'user',
  });

  useEffect(() => {
    api
      .get('/activity/guild-icon')
      .then((guild) => setState((prev) => ({ ...prev, guild })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function verify() {
      try {
        await ensureReady();

        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify'],
        });

        setState((prev) => ({ ...prev, phase: 'verifying' }));

        const data = await api.post('/activity/token', { code });
        setAuthToken(data.token);

        setState((prev) => ({
          ...prev,
          status: 'ready',
          phase: 'ready',
          user: data.user,
          isAdmin: data.isAdmin,
          isSanctionsManager: data.isSanctionsManager,
          isFounder: data.isFounder,
          viewMode: data.isAdmin ? 'staff' : 'user',
          error: null,
        }));
      } catch (err) {
        setState((prev) => ({ ...prev, status: 'error', error: err.message }));
      }
    }
    verify();
  }, []);

  function setViewMode(mode) {
    setState((prev) => {
      if (mode === 'staff' && !prev.isAdmin) return prev;
      return { ...prev, viewMode: mode };
    });
  }

  return <IdentityContext.Provider value={{ ...state, setViewMode }}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity debe usarse dentro de IdentityProvider');
  return ctx;
}
