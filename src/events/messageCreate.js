import { getStickyChannels } from '../shared/stickyStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild) return;

    const sticky = getStickyChannels();
    const pinnedId = sticky[message.channelId];
    if (!pinnedId || message.id === pinnedId) return;

    try {
      await message.delete();
    } catch (err) {
      logger.error('sticky', `No se pudo borrar un mensaje en el canal fijado ${message.channelId}: ${err.message}`);
    }
  },
};
