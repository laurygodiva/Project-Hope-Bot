import { getQuiz } from '../shared/loreQuizRegistry.js';
import { logger } from '../shared/logger.js';

async function handleLoreQuizAnswer(interaction) {
  const quiz = getQuiz(interaction.message.id);
  if (!quiz || quiz.resolved) {
    return interaction.reply({ content: 'Este Lore Quizz ya no está activo.', ephemeral: true });
  }
  if (quiz.firstAnswerByUser.has(interaction.user.id)) {
    return interaction.reply({ content: 'Ya has respondido a este Lore Quizz; solo cuenta tu primera respuesta.', ephemeral: true });
  }

  const idx = Number(interaction.values[0]);
  quiz.firstAnswerByUser.set(interaction.user.id, idx);
  const correct = idx === quiz.correctIndex;
  const justResolved = correct && !quiz.resolved;
  if (justResolved) quiz.resolved = true;

  await interaction.reply({
    content: correct ? '✅ ¡Respuesta correcta!' : '❌ Respuesta registrada, no era la correcta.',
    ephemeral: true,
  });

  if (justResolved) {
    try {
      await interaction.message.channel.send(`🎉 <@${interaction.user.id}> ha acertado el Lore Quizz.`);
    } catch (err) {
      logger.error('lore-quiz', `No se pudo anunciar al ganador: ${err.message}`);
    }
  }
}

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isStringSelectMenu() && interaction.customId === 'lore-quiz-select') {
      try {
        await handleLoreQuizAnswer(interaction);
      } catch (err) {
        logger.error('lore-quiz', `Error gestionando respuesta: ${err.stack}`);
      }
      return;
    }

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
