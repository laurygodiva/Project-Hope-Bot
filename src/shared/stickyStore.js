import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STICKY_PATH = path.join(DATA_DIR, 'sticky-channels.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  ensureDir();
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  ensureDir();
  const tmp = `${file}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fsp.rename(tmp, file);
}

// { [channelId]: string[] de messageId } — un canal puede tener varios
// mensajes fijados a la vez. toArray normaliza entradas del formato antiguo
// (un único messageId como string, de antes de soportar varios) para que un
// dato viejo en disco no rompa el push/filter de más abajo.
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

export function getStickyChannels() {
  const raw = readJson(STICKY_PATH, {});
  const normalized = {};
  for (const [channelId, value] of Object.entries(raw)) {
    normalized[channelId] = toArray(value);
  }
  return normalized;
}

export function getStickyMessageIds(channelId) {
  return getStickyChannels()[channelId] || [];
}

export async function addStickyMessage(channelId, messageId) {
  const map = getStickyChannels();
  const list = map[channelId] || [];
  if (!list.includes(messageId)) list.push(messageId);
  map[channelId] = list;
  await writeJson(STICKY_PATH, map);
}

export async function removeStickyMessage(channelId, messageId) {
  const map = getStickyChannels();
  const list = (map[channelId] || []).filter((id) => id !== messageId);
  if (list.length) map[channelId] = list;
  else delete map[channelId];
  await writeJson(STICKY_PATH, map);
}
