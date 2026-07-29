import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { logger } from './logger.js';

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

export async function loadEvents(client, dir) {
  if (!fs.existsSync(dir)) return;
  const files = await walk(dir);
  for (const file of files) {
    const mod = await import(url.pathToFileURL(file).href);
    const { name, once, execute } = mod.default ?? mod;
    if (!name || !execute) {
      logger.warn('loaders', `Event file skipped (missing name/execute): ${file}`);
      continue;
    }
    if (once) client.once(name, (...args) => execute(...args, client));
    else client.on(name, (...args) => execute(...args, client));
    logger.info('loaders', `Loaded event: ${name}`);
  }
}

export async function loadCommands(client, dir) {
  client.commands = new Map();
  if (!fs.existsSync(dir)) return [];
  const files = await walk(dir);
  const commandData = [];
  for (const file of files) {
    const mod = await import(url.pathToFileURL(file).href);
    const command = mod.default ?? mod;
    if (!command?.data || !command?.execute) {
      logger.warn('loaders', `Command file skipped (missing data/execute): ${file}`);
      continue;
    }
    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON ? command.data.toJSON() : command.data);
    logger.info('loaders', `Loaded command: ${command.data.name}`);
  }
  return commandData;
}
