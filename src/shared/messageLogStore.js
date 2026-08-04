import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DELETED_PATH = path.join(DATA_DIR, 'deleted-messages.json');
const EDITED_PATH = path.join(DATA_DIR, 'edited-messages.json');
const MAX_ENTRIES = 2000;

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

async function append(file, entry) {
  const list = readJson(file, []);
  list.push(entry);
  if (list.length > MAX_ENTRIES) list.splice(0, list.length - MAX_ENTRIES);
  await writeJson(file, list);
}

export function getDeletedMessages() {
  return readJson(DELETED_PATH, []).slice().reverse();
}

export function getEditedMessages() {
  return readJson(EDITED_PATH, []).slice().reverse();
}

export async function logDeletedMessage(entry) {
  await append(DELETED_PATH, entry);
}

export async function logEditedMessage(entry) {
  await append(EDITED_PATH, entry);
}
