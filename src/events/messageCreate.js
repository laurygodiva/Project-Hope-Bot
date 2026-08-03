import { getStickyMessageIds } from '../shared/stickyStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild) return;

    const stickyIds = getStickyMessageIds(message.channelId);
    if (stickyIds.length === 0 || stickyIds.includes(message.id)) return;

    try {
      await message.delete();
    } catch (err) {
      logger.error('sticky', `No se pudo borrar un mensaje en el canal fijado ${message.channelId}: ${err.message}`);
    }
  },
};
