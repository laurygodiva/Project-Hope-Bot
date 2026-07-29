import { logger } from '../shared/logger.js';
import { startPresenceRotation } from '../shared/presence.js';

export default {
  name: 'clientReady',
  once: true,
  execute(client) {
    logger.success('discord', `Conectado como ${client.user.tag}`);
    startPresenceRotation(client);
  },
};
