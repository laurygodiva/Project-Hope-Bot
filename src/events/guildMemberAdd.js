import { appendMemberEvent } from '../shared/memberEventsStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'guildMemberAdd',
  execute(member) {
    appendMemberEvent({ type: 'join', timestamp: new Date().toISOString() }).catch((err) =>
      logger.error('member-events', `No se pudo registrar entrada de ${member.id}: ${err.message}`)
    );
  },
};
