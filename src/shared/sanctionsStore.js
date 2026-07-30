import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_AGGRAVATORS } from './sanctionsEngine.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CATALOG_PATH = path.join(DATA_DIR, 'sanctions-catalog.json');
const CASES_PATH = path.join(DATA_DIR, 'sanctions-cases.json');
const QUEUE_PATH = path.join(DATA_DIR, 'sanctions-queue.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'sanctions-settings.json');
const AGGRAVATORS_PATH = path.join(DATA_DIR, 'sanctions-aggravators.json');

const DEFAULT_SETTINGS = {
  embed: {
    title: 'Sanción aplicada',
    description:
      'Hola {usuario}, se te ha aplicado una sanción en el servidor por: {sanciones}.\nDuración: {duracion}.\nSi crees que es un error, contacta con el staff.',
    color: '#5b66ff',
    imageURL: '',
    thumbnailURL: '',
    footer: '',
    footerIconURL: '',
  },
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
  const stored = readJson(SETTINGS_PATH, {});
  return { embed: { ...DEFAULT_SETTINGS.embed, ...(stored.embed || {}) } };
}

export async function saveSettings(settings) {
  await writeJson(SETTINGS_PATH, settings);
}

export function getAggravators() {
  const stored = readJson(AGGRAVATORS_PATH, null);
  return stored || DEFAULT_AGGRAVATORS;
}

export async function saveAggravators(aggravators) {
  await writeJson(AGGRAVATORS_PATH, aggravators);
}
