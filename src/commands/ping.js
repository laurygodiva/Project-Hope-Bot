import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Comprueba que el bot responde'),
  async execute(interaction) {
    await interaction.reply(`Pong! (${interaction.client.ws.ping}ms)`);
  },
};
