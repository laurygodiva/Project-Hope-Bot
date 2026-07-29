import { DiscordSDK } from '@discord/embedded-app-sdk';

export const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

let readyPromise = null;

// Debe llamarse una única vez, antes de pedir la identidad del usuario.
export function ensureReady() {
  if (!readyPromise) readyPromise = discordSdk.ready();
  return readyPromise;
}
