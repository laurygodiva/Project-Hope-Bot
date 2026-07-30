import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CATALOG_PATH = path.join(DATA_DIR, 'sanctions-catalog.json');
const CASES_PATH = path.join(DATA_DIR, 'sanctions-cases.json');
const QUEUE_PATH = path.join(DATA_DIR, 'sanctions-queue.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'sanctions-settings.json');

const DEFAULT_SETTINGS = {
  dmTemplate:
    'Hola {usuario}, se te ha aplicado una sanción en el servidor por: {sanciones}.\nDuración: {duracion}.\nSi crees que es un error, contacta con el staff.',
};

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

export function getCatalog() {
  return readJson(CATALOG_PATH, []);
}

export async function saveCatalog(catalog) {
  await writeJson(CATALOG_PATH, catalog);
}

export function getCases() {
  return readJson(CASES_PATH, []);
}

export async function saveCases(cases) {
  await writeJson(CASES_PATH, cases);
}

export function getQueue() {
  return readJson(QUEUE_PATH, []);
}

export async function saveQueue(queue) {
  await writeJson(QUEUE_PATH, queue);
}

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_PATH, {}) };
}

export async function saveSettings(settings) {
  await writeJson(SETTINGS_PATH, settings);
}
