import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { loadEvents, loadCommands } from './src/shared/loaders.js';
import { startServer } from './src/api/server.js';
import { logger } from './src/shared/logger.js';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

async function main() {
  await loadEvents(client, path.join(__dirname, 'src', 'events'));
  const commandData = await loadCommands(client, path.join(__dirname, 'src', 'commands'));

  await client.login(process.env.DISCORD_TOKEN);

  if (process.env.DISCORD_GUILD_ID) {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: commandData }
    );
    logger.success('discord', `${commandData.length} comando(s) registrados en el servidor`);
  }

  startServer(client);
}

main().catch((err) => {
  logger.error('bootstrap', err.stack);
  process.exit(1);
});
