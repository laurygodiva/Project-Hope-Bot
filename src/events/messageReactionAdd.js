import { getQuiz } from '../shared/loreQuizRegistry.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch (err) {
      logger.error('lore-quiz', `No se pudo cargar la reacción: ${err.message}`);
      return;
    }

    const quiz = getQuiz(reaction.message.id);
    if (!quiz || quiz.resolved) return;

    const emote = reaction.emoji.name;
    const alreadyReacted = quiz.firstReactionByUser.get(user.id);

    if (alreadyReacted) {
      if (alreadyReacted !== emote) {
        // Ya tenía una primera reacción registrada: cualquier otra se retira,
        // solo cuenta la primera que puso.
        await reaction.users.remove(user.id).catch(() => {});
      }
      return;
    }

    quiz.firstReactionByUser.set(user.id, emote);

    if (emote === quiz.correctEmote) {
      quiz.resolved = true;
      try {
        await reaction.message.channel.send(`🎉 <@${user.id}> ha acertado el Lore Quizz con la respuesta correcta.`);
      } catch (err) {
        logger.error('lore-quiz', `No se pudo anunciar al ganador: ${err.message}`);
      }
    }
  },
};
