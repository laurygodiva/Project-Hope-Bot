import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const EVENTS_PATH = path.join(DATA_DIR, 'member-events.json');
const MAX_EVENTS = 20000;

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

export function getMemberEvents() {
  return readJson(EVENTS_PATH, []);
}

export async function appendMemberEvent(event) {
  const events = getMemberEvents();
  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  await writeJson(EVENTS_PATH, events);
}
