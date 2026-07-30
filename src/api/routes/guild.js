import { Router } from 'express';
import { ChannelType, EmbedBuilder } from 'discord.js';

function buildEmbed(embed) {
  const builder = new EmbedBuilder();
  if (embed.title) builder.setTitle(embed.title);
  if (embed.description) builder.setDescription(embed.description);
  if (embed.color) builder.setColor(embed.color);
  if (embed.imageURL) builder.setImage(embed.imageURL);
  if (embed.thumbnailURL) builder.setThumbnail(embed.thumbnailURL);
  if (embed.footer) builder.setFooter({ text: embed.footer, iconURL: embed.footerIconURL || undefined });
  return builder;
}

export function createGuildRouter(client) {
  const router = Router();

  function getGuild(res) {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) {
      res.status(500).json({ error: 'Servidor de Discord no disponible' });
      return null;
    }
    return guild;
  }

  router.get('/channels', (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;
    const channels = guild.channels.cache
      .map((c) => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId, position: c.position }))
      .sort((a, b) => a.position - b.position);
    res.json(channels);
  });

  router.get('/roles', (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;
    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position, memberCount: r.members.size }));
    res.json(roles);
  });

  router.get('/members', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const search = (req.query.search || '').toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const members = await guild.members.fetch();
    const filtered = members
      .filter((m) => !search || m.user.username.toLowerCase().includes(search) || m.displayName.toLowerCase().includes(search))
      .first(limit)
      .map((m) => ({
        id: m.id,
        username: m.user.username,
        displayName: m.displayName,
        avatar: m.user.displayAvatarURL({ size: 64 }),
        roles: m.roles.cache.filter((r) => r.id !== guild.id).map((r) => r.id),
        joinedAt: m.joinedAt,
      }));

    res.json(filtered);
  });

  router.patch('/members/:id/roles', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const { add, remove } = req.body;
    const member = await guild.members.fetch(req.params.id).catch(() => null);
    if (!member) return res.status(404).json({ error: 'Miembro no encontrado' });

    try {
      if (add) await member.roles.add(add);
      if (remove) await member.roles.remove(remove);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'No se pudo modificar el rol (¿permisos del bot insuficientes?)' });
    }
  });

  router.delete('/members/:id', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const member = await guild.members.fetch(req.params.id).catch(() => null);
    if (!member) return res.status(404).json({ error: 'Miembro no encontrado' });

    try {
      await member.kick(req.body?.reason || 'Expulsado desde la Activity de administración');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'No se pudo expulsar (¿permisos del bot insuficientes?)' });
    }
  });

  router.post('/channels/:id/messages', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const { content, mode, username, avatarURL, messageType, embed } = req.body;
    const hasEmbed = messageType === 'embed' && embed && (embed.title || embed.description || embed.imageURL);
    if ((!content || !content.trim()) && !hasEmbed) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    const channel = guild.channels.cache.get(req.params.id);
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ error: 'Canal no encontrado o no es de texto' });
    }

    const payload = {
      content: content?.trim() || undefined,
      embeds: hasEmbed ? [buildEmbed(embed)] : undefined,
    };

    try {
      if (mode === 'webhook') {
        const webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find((w) => w.owner?.id === guild.client.user.id);
        if (!webhook) {
          webhook = await channel.createWebhook({
            name: 'Panel de administración',
            reason: 'Webhook creado por la Activity de administración',
          });
        }
        await webhook.send({
          ...payload,
          username: username || undefined,
          avatarURL: avatarURL || undefined,
        });
      } else {
        await channel.send(payload);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'No se pudo enviar el mensaje (¿permisos del bot insuficientes o color/URL inválidos?)' });
    }
  });

  return router;
}
