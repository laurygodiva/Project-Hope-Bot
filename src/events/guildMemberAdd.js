import { appendMemberEvent } from '../shared/memberEventsStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'guildMemberAdd',
  execute(member) {
    logger.info('member-events', `guildMemberAdd recibido para ${member.user?.tag || member.id}`);
    appendMemberEvent({ type: 'join', timestamp: new Date().toISOString() })
      .then(() => logger.success('member-events', `Entrada registrada: ${member.user?.tag || member.id}`))
      .catch((err) => logger.error('member-events', `No se pudo registrar entrada de ${member.id}: ${err.message}`));
  },
};
