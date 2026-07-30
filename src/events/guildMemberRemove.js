import { appendMemberEvent } from '../shared/memberEventsStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'guildMemberRemove',
  execute(member) {
    appendMemberEvent({ type: 'leave', timestamp: new Date().toISOString() }).catch((err) =>
      logger.error('member-events', `No se pudo registrar salida de ${member.id}: ${err.message}`)
    );
  },
};
