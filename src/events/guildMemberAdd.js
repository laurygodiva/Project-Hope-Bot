import { appendMemberEvent } from '../shared/memberEventsStore.js';
import { isBlacklisted, addDangerFlag } from '../shared/threatStore.js';
import { logger } from '../shared/logger.js';

const NEW_ACCOUNT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    logger.info('member-events', `guildMemberAdd recibido para ${member.user?.tag || member.id}`);
    appendMemberEvent({
      type: 'join',
      timestamp: new Date().toISOString(),
      userId: member.id,
      username: member.user?.tag || member.user?.username || member.id,
      avatar: member.user?.displayAvatarURL?.({ size: 64 }) || null,
    })
      .then(() => logger.success('member-events', `Entrada registrada: ${member.user?.tag || member.id}`))
      .catch((err) => logger.error('member-events', `No se pudo registrar entrada de ${member.id}: ${err.message}`));

    if (isBlacklisted(member.id)) {
      try {
        await member.kick('Usuario en la lista negra (vetado)');
        logger.success('blacklist', `Expulsado automáticamente por estar vetado: ${member.user?.tag || member.id}`);
      } catch (err) {
        logger.error('blacklist', `No se pudo expulsar a ${member.id}: ${err.message}`);
      }
      return;
    }

    const accountAge = Date.now() - member.user.createdTimestamp;
    if (accountAge < NEW_ACCOUNT_THRESHOLD_MS) {
      const days = (accountAge / (24 * 60 * 60 * 1000)).toFixed(1);
      addDangerFlag(member.id, 'cuenta_nueva', `Cuenta creada ${days} día(s) antes de unirse al servidor`).catch((err) =>
        logger.error('threat-detect', err.message)
      );
    }
  },
};
