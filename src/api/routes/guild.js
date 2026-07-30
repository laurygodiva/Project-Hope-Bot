import { Router } from 'express';
import { ChannelType } from 'discord.js';
import { buildEmbed } from '../../shared/embedBuilder.js';
import { getMemberEvents } from '../../shared/memberEventsStore.js';

const RANGE_BUCKETS = { day: 14, week: 12, month: 12, year: 5 };

function labelFor(range, start) {
  if (range === 'year') return String(start.getFullYear());
  if (range === 'month') return start.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  return `${start.getDate()}/${start.getMonth() + 1}`;
}

function buildStatsSeries(events, range) {
  const count = RANGE_BUCKETS[range] || RANGE_BUCKETS.day;
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i--) {
    let start, end;
    if (range === 'month') {
      start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    } else if (range === 'year') {
      start = new Date(now.getFullYear() - i, 0, 1);
      end = new Date(now.getFullYear() - i + 1, 0, 1);
    } else {
      const stepDays = range === 'week' ? 7 : 1;
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * stepDays + 1);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i + 1) * stepDays + 1);
    }
    buckets.push({ key: start.toISOString(), label: labelFor(range, start), start, end, joins: 0, leaves: 0 });
  }

  for (const ev of events) {
    const evDate = new Date(ev.timestamp);
    const bucket = buckets.find((b) => evDate >= b.start && evDate < b.end);
    if (!bucket) continue;
    if (ev.type === 'join') bucket.joins++;
    else bucket.leaves++;
  }

  return buckets.map(({ key, label, joins, leaves }) => ({ key, label, joins, leaves }));
}

function buildMessagePayload({ content, messageType, embed }) {
  const hasEmbed = messageType === 'embed' && embed && (embed.title || embed.description || embed.imageURL);
  if ((!content || !content.trim()) && !hasEmbed) return null;
  return {
    content: content?.trim() || undefined,
    embeds: hasEmbed ? [buildEmbed(embed)] : undefined,
  };
}

const MEMBERS_CACHE_TTL = 60_000;
let membersCache = null;
let membersCacheAt = 0;

async function getAllMembers(guild) {
  const now = Date.now();
  if (membersCache && now - membersCacheAt < MEMBERS_CACHE_TTL) return membersCache;
  membersCache = await guild.members.fetch();
  membersCacheAt = now;
  return membersCache;
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

  router.get('/mention-names', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const userIds = String(req.query.userIds || '').split(',').filter(Boolean);
    const roleIds = String(req.query.roleIds || '').split(',').filter(Boolean);
    const channelIds = String(req.query.channelIds || '').split(',').filter(Boolean);

    const users = {};
    for (const id of userIds) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (member) users[id] = member.displayName;
    }

    const roles = {};
    for (const id of roleIds) {
      const role = guild.roles.cache.get(id);
      if (role) roles[id] = role.name;
    }

    const channels = {};
    for (const id of channelIds) {
      const channel = guild.channels.cache.get(id);
      if (channel) channels[id] = channel.name;
    }

    res.json({ users, roles, channels });
  });

  router.get('/emojis', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const guildEmojis = guild.emojis.cache.map((e) => ({
      id: e.id,
      name: e.name,
      animated: e.animated,
      url: e.imageURL({ extension: e.animated ? 'gif' : 'png', size: 32 }),
      source: 'guild',
    }));

    let botEmojis = [];
    try {
      const fetched = await client.application.emojis.fetch();
      botEmojis = fetched.map((e) => ({
        id: e.id,
        name: e.name,
        animated: e.animated,
        url: e.imageURL({ extension: e.animated ? 'gif' : 'png', size: 32 }),
        source: 'bot',
      }));
    } catch {
      // el bot puede no tener emojis propios todavía
    }

    res.json([...botEmojis, ...guildEmojis]);
  });

  router.get('/stats', (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const range = ['day', 'week', 'month', 'year'].includes(req.query.range) ? req.query.range : 'day';
    const events = getMemberEvents();
    const series = buildStatsSeries(events, range);

    res.json({ totalMembers: guild.memberCount, range, series, totalEventsLogged: events.length });
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
    const roleId = req.query.role;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    try {
      const members = await getAllMembers(guild);
      const filtered = members
        .filter((m) => !search || m.user.username.toLowerCase().includes(search) || m.displayName.toLowerCase().includes(search))
        .filter((m) => !roleId || m.roles.cache.has(roleId))
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
    } catch (err) {
      res.status(503).json({ error: 'Discord está limitando las peticiones de miembros ahora mismo, prueba de nuevo en unos segundos' });
    }
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
    const payload = buildMessagePayload({ content, messageType, embed });
    if (!payload) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });

    const channel = guild.channels.cache.get(req.params.id);
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ error: 'Canal no encontrado o no es de texto' });
    }

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

  router.post('/users/:id/messages', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const { content, messageType, embed } = req.body;
    const payload = buildMessagePayload({ content, messageType, embed });
    if (!payload) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });

    const member = await guild.members.fetch(req.params.id).catch(() => null);
    if (!member) return res.status(404).json({ error: 'Usuario no encontrado en el servidor' });

    try {
      await member.send(payload);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'No se pudo enviar el MD (puede tener los mensajes directos cerrados)' });
    }
  });

  return router;
}
