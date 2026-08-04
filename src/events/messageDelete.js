import { AuditLogEvent } from 'discord.js';
import { logDeletedMessage } from '../shared/messageLogStore.js';
import { logger } from '../shared/logger.js';

async function findDeleter(message) {
  try {
    const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 5 });
    const entry = logs.entries.find(
      (e) =>
        e.extra?.channel?.id === message.channelId &&
        e.target?.id === message.author?.id &&
        Date.now() - e.createdTimestamp < 10_000
    );
    if (!entry) return null;
    return {
      id: entry.executor?.id || null,
      tag: entry.executor?.tag || entry.executor?.username || null,
      avatar: entry.executor?.displayAvatarURL?.({ size: 64 }) || null,
    };
  } catch (err) {
    logger.error('message-log', `No se pudo consultar el registro de auditoría: ${err.message}`);
    return null;
  }
}

export default {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    const deleter = await findDeleter(message);

    await logDeletedMessage({
      messageId: message.id,
      channelId: message.channelId,
      channelName: message.channel?.name || null,
      content: message.content ?? null,
      authorId: message.author?.id || null,
      authorTag: message.author?.tag || message.author?.username || null,
      authorAvatar: message.author?.displayAvatarURL?.({ size: 64 }) || null,
      sentAt: message.createdAt ? message.createdAt.toISOString() : null,
      deletedAt: new Date().toISOString(),
      deletedBy: deleter,
    }).catch((err) => logger.error('message-log', `No se pudo registrar mensaje eliminado: ${err.message}`));
  },
};
