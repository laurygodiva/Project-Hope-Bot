import { getStickyMessageIds } from '../shared/stickyStore.js';
import { addDangerFlag } from '../shared/threatStore.js';
import { findScamDomain } from '../shared/scamDomains.js';
import { logger } from '../shared/logger.js';

const INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

const MASS_MESSAGE_WINDOW_MS = 10_000;
const MASS_MESSAGE_THRESHOLD = 6;
const REPEATED_URL_THRESHOLD = 3;
const FLAG_COOLDOWN_MS = 5 * 60_000;

// Rastreo en memoria (se pierde al reiniciar, a propósito: solo sirve para
// detectar ráfagas recientes, no hace falta persistirlo).
const recentMessages = new Map(); // userId -> timestamps[]
const urlCounts = new Map(); // userId -> Map(url -> count)
const lastFlagAt = new Map(); // `${userId}:${reason}` -> timestamp

function onCooldown(userId, reason) {
  const key = `${userId}:${reason}`;
  const last = lastFlagAt.get(key);
  if (last && Date.now() - last < FLAG_COOLDOWN_MS) return true;
  lastFlagAt.set(key, Date.now());
  return false;
}

function checkMassMessages(message) {
  const userId = message.author.id;
  const now = Date.now();
  const timestamps = (recentMessages.get(userId) || []).filter((t) => now - t < MASS_MESSAGE_WINDOW_MS);
  timestamps.push(now);
  recentMessages.set(userId, timestamps);

  if (timestamps.length >= MASS_MESSAGE_THRESHOLD && !onCooldown(userId, 'mensajes_masivos')) {
    addDangerFlag(userId, 'mensajes_masivos', `${timestamps.length} mensajes en ${MASS_MESSAGE_WINDOW_MS / 1000}s en #${message.channel?.name || message.channelId}`).catch(
      (err) => logger.error('threat-detect', err.message)
    );
  }
}

function checkRepeatedUrl(message) {
  const urls = message.content.match(URL_REGEX);
  if (!urls) return;
  const userId = message.author.id;
  const counts = urlCounts.get(userId) || new Map();

  for (const url of urls) {
    const count = (counts.get(url) || 0) + 1;
    counts.set(url, count);
    if (count >= REPEATED_URL_THRESHOLD && !onCooldown(userId, `url:${url}`)) {
      addDangerFlag(userId, 'url_repetida', `"${url}" enviada ${count} veces`).catch((err) => logger.error('threat-detect', err.message));
    }
  }
  urlCounts.set(userId, counts);
}

function checkInviteLink(message) {
  if (!INVITE_REGEX.test(message.content)) return;
  const userId = message.author.id;
  if (onCooldown(userId, 'invite_link')) return;
  addDangerFlag(userId, 'invite_link', `Enlace de invitación en #${message.channel?.name || message.channelId}`).catch((err) =>
    logger.error('threat-detect', err.message)
  );
}

function checkScamDomain(message) {
  const match = findScamDomain(message.content);
  if (!match) return;
  const userId = message.author.id;
  if (onCooldown(userId, 'scam_domain')) return;
  addDangerFlag(userId, 'scam_domain', `${match.url} (dominio: ${match.domain})`).catch((err) => logger.error('threat-detect', err.message));
}

export default {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild) return;

    if (!message.author?.bot && message.content) {
      checkMassMessages(message);
      checkRepeatedUrl(message);
      checkInviteLink(message);
      checkScamDomain(message);
    }

    const stickyIds = getStickyMessageIds(message.channelId);
    if (stickyIds.length === 0 || stickyIds.includes(message.id)) return;

    try {
      await message.delete();
    } catch (err) {
      logger.error('sticky', `No se pudo borrar un mensaje en el canal fijado ${message.channelId}: ${err.message}`);
    }
  },
};
