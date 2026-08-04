import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FLAGS_PATH = path.join(DATA_DIR, 'danger-flags.json');
const BLACKLIST_PATH = path.join(DATA_DIR, 'blacklist.json');
const MAX_FLAGS_PER_USER = 50;

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

// { [userId]: [{ reason, detail, at }] }
export function getDangerFlags() {
  return readJson(FLAGS_PATH, {});
}

export async function addDangerFlag(userId, reason, detail) {
  const flags = getDangerFlags();
  const list = flags[userId] || [];
  list.push({ reason, detail, at: new Date().toISOString() });
  if (list.length > MAX_FLAGS_PER_USER) list.splice(0, list.length - MAX_FLAGS_PER_USER);
  flags[userId] = list;
  await writeJson(FLAGS_PATH, flags);
}

export async function clearDangerFlags(userId) {
  const flags = getDangerFlags();
  delete flags[userId];
  await writeJson(FLAGS_PATH, flags);
}

// [{ id, reason, addedBy, addedAt }]
export function getBlacklist() {
  return readJson(BLACKLIST_PATH, []);
}

export function isBlacklisted(userId) {
  return getBlacklist().some((e) => e.id === userId);
}

export async function addToBlacklist(userId, reason, addedBy) {
  const list = getBlacklist();
  if (list.some((e) => e.id === userId)) return list;
  list.push({ id: userId, reason: reason || '', addedBy, addedAt: new Date().toISOString() });
  await writeJson(BLACKLIST_PATH, list);
  return list;
}

export async function removeFromBlacklist(userId) {
  const list = getBlacklist().filter((e) => e.id !== userId);
  await writeJson(BLACKLIST_PATH, list);
  return list;
}
