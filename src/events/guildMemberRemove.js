import { appendMemberEvent } from '../shared/memberEventsStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'guildMemberRemove',
  execute(member) {
    logger.info('member-events', `guildMemberRemove recibido para ${member.user?.tag || member.id}`);
    appendMemberEvent({ type: 'leave', timestamp: new Date().toISOString() })
      .then(() => logger.success('member-events', `Salida registrada: ${member.user?.tag || member.id}`))
      .catch((err) => logger.error('member-events', `No se pudo registrar salida de ${member.id}: ${err.message}`));
  },
};
