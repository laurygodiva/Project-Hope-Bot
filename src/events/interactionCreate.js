import { logger } from '../shared/logger.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error('commands', `Error ejecutando /${interaction.commandName}: ${err.stack}`);
      const payload = { content: 'Hubo un error al ejecutar el comando.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
      else await interaction.reply(payload);
    }
  },
};
