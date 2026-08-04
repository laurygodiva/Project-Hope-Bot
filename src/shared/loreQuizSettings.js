import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'lore-quiz-settings.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getLoreQuizSettings() {
  ensureDir();
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return { iconURL: '', imageURL: '' };
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return { iconURL: '', imageURL: '' };
  }
}

export async function saveLoreQuizSettings(settings) {
  ensureDir();
  const tmp = `${SETTINGS_PATH}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(settings, null, 2), 'utf8');
  await fsp.rename(tmp, SETTINGS_PATH);
}
