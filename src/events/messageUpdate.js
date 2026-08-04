import { logEditedMessage } from '../shared/messageLogStore.js';
import { logger } from '../shared/logger.js';

export default {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await logEditedMessage({
      messageId: newMessage.id,
      channelId: newMessage.channelId,
      channelName: newMessage.channel?.name || null,
      authorId: newMessage.author?.id || null,
      authorTag: newMessage.author?.tag || newMessage.author?.username || null,
      authorAvatar: newMessage.author?.displayAvatarURL?.({ size: 64 }) || null,
      originalContent: oldMessage.content ?? null,
      editedContent: newMessage.content ?? null,
      sentAt: newMessage.createdAt ? newMessage.createdAt.toISOString() : null,
      editedAt: new Date().toISOString(),
    }).catch((err) => logger.error('message-log', `No se pudo registrar mensaje editado: ${err.message}`));
  },
};
