import { AttachmentBuilder } from 'discord.js';

// Discord no tiene límite de almacenamiento gratuito y ya tenemos el bot
// conectado, así que usamos un canal oculto del servidor como "blob storage"
// para las imágenes de tickets: se sube el archivo ahí y nos quedamos solo
// con la URL del CDN de Discord, sin guardar binarios en disco.
export async function uploadTicketImages(client, files) {
  if (!files || files.length === 0) return [];

  const channelId = process.env.TICKET_STORAGE_CHANNEL_ID;
  if (!channelId) throw new Error('TICKET_STORAGE_CHANNEL_ID no está configurado');

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) throw new Error('Canal de almacenamiento de tickets no disponible');

  const attachments = files.map((f) => new AttachmentBuilder(f.buffer, { name: f.originalname }));
  const sent = await channel.send({ files: attachments });
  return [...sent.attachments.values()].map((a) => a.url);
}
