import { Router } from 'express';
import multer from 'multer';
import {
  getTickets,
  getTicket,
  createTicket,
  addTicketMessage,
  claimTicket,
  unclaimTicket,
  closeTicket,
  setNotifyPreference,
  markTicketRead,
  deleteTicket,
  addParticipant,
  getTicketParticipantIds,
  hasUnreadForClaimer,
} from '../../shared/ticketStore.js';
import { uploadTicketImages } from '../../shared/ticketAttachments.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 5 } });

const CATEGORIES = ['soporte', 'reporte', 'ck', 'playmaker'];

function requireStaff(req, res, next) {
  if (!req.activityUser?.isAdmin) return res.status(403).json({ error: 'No tienes permisos de staff' });
  next();
}

function requireFounder(req, res, next) {
  if (!req.activityUser?.isFounder) return res.status(403).json({ error: 'No tienes permisos de fundador' });
  next();
}

function summarize(t, viewerId) {
  return {
    id: t.id,
    category: t.category,
    title: t.title,
    creatorId: t.creatorId,
    creatorTag: t.creatorTag,
    creatorAvatar: t.creatorAvatar,
    status: t.status,
    claimedBy: t.claimedBy,
    createdAt: t.createdAt,
    lastMessageAt: t.lastMessageAt,
    closedAt: t.closedAt,
    closedBy: t.closedBy,
    unread: hasUnreadForClaimer(t, viewerId),
  };
}

function actorFromReq(req) {
  return {
    id: req.activityUser.userId,
    tag: req.activityUser.username,
    avatar: req.activityUser.avatar
      ? `https://cdn.discordapp.com/avatars/${req.activityUser.userId}/${req.activityUser.avatar}.png?size=64`
      : `https://cdn.discordapp.com/embed/avatars/0.png`,
  };
}

function canView(ticket, req) {
  return (
    req.activityUser.isAdmin ||
    ticket.creatorId === req.activityUser.userId ||
    (ticket.participants || []).includes(req.activityUser.userId)
  );
}

async function notifyParticipants(client, ticket, author) {
  const optIn = new Set(ticket.notifyOptIn || []);
  const targets = [...getTicketParticipantIds(ticket)].filter((id) => id !== author.id && optIn.has(id));
  if (targets.length === 0) return;

  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
  if (!guild) return;

  await Promise.allSettled(
    targets.map(async (userId) => {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return;
      await member
        .send(`**${author.tag}** te ha respondido en el ticket **${ticket.title}**. Entra a la Activity para verlo.`)
        .catch(() => {});
    })
  );
}

export function createTicketsRouter(client) {
  const router = Router();

  router.post('/', upload.array('images', 5), async (req, res) => {
    const { category, title, description } = req.body;
    let links = [];
    try {
      links = req.body.links ? JSON.parse(req.body.links) : [];
    } catch {
      links = [];
    }

    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Categoría inválida' });
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'El título y la descripción son obligatorios' });
    }

    try {
      const images = await uploadTicketImages(client, req.files);
      const ticket = await createTicket({
        category,
        title: title.trim(),
        description: description.trim(),
        links: (links || []).filter(Boolean),
        images,
        creator: actorFromReq(req),
      });
      res.json(ticket);
    } catch (err) {
      res.status(500).json({ error: `No se pudo crear el ticket: ${err.message}` });
    }
  });

  router.get('/unread-summary', requireStaff, (req, res) => {
    const userId = req.activityUser.userId;
    const claimed = getTickets().filter((t) => t.status === 'claimed' && t.claimedBy?.id === userId);
    const byCategory = { soporte: false, reporte: false, ck: false, playmaker: false };
    for (const t of claimed) {
      if (hasUnreadForClaimer(t, userId)) byCategory[t.category] = true;
    }
    res.json({ any: Object.values(byCategory).some(Boolean), byCategory });
  });

  router.get('/mine', (req, res) => {
    const userId = req.activityUser.userId;
    const onlyCreated = req.query.onlyCreated === 'true';
    const mine = getTickets()
      .filter((t) =>
        onlyCreated
          ? t.creatorId === userId || (t.participants || []).includes(userId)
          : t.creatorId === userId || t.claimedBy?.id === userId || (t.participants || []).includes(userId)
      )
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json(mine.map((t) => summarize(t, userId)));
  });

  router.get('/', requireStaff, (req, res) => {
    const { category, search } = req.query;
    let list = getTickets().filter((t) => t.status !== 'closed');
    if (category) list = list.filter((t) => t.category === category);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((t) => t.id.includes(search) || t.creatorTag?.toLowerCase().includes(s) || t.creatorId === search);
    }
    list.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json(list.map((t) => summarize(t, req.activityUser.userId)));
  });

  router.get('/history', requireStaff, (req, res) => {
    const { category, search } = req.query;
    let list = getTickets().filter((t) => t.status === 'closed');
    if (category) list = list.filter((t) => t.category === category);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((t) => t.id.includes(search) || t.creatorTag?.toLowerCase().includes(s) || t.creatorId === search);
    }
    list.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
    res.json(list.map((t) => summarize(t, req.activityUser.userId)));
  });

  router.get('/:id', (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!canView(ticket, req)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    res.json(ticket);
  });

  router.post('/:id/messages', upload.array('images', 5), async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!canView(ticket, req)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    if (ticket.status === 'closed') return res.status(400).json({ error: 'El ticket está cerrado' });

    const { content } = req.body;
    if (!content?.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    try {
      const author = actorFromReq(req);
      const images = await uploadTicketImages(client, req.files);
      const updated = await addTicketMessage(req.params.id, {
        author,
        content: content?.trim() || '',
        images,
      });
      notifyParticipants(client, updated, author).catch(() => {});
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: `No se pudo enviar el mensaje: ${err.message}` });
    }
  });

  router.post('/:id/read', (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!canView(ticket, req)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    markTicketRead(req.params.id, req.activityUser.userId).then((updated) => res.json(updated));
  });

  router.delete('/:id', requireFounder, async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.status !== 'closed') return res.status(400).json({ error: 'Solo se pueden eliminar tickets del historial' });
    await deleteTicket(req.params.id);
    res.json({ ok: true });
  });

  router.post('/:id/participants', requireStaff, async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const userId = req.body.userId?.trim();
    if (!userId) return res.status(400).json({ error: 'Falta el ID de usuario' });
    const updated = await addParticipant(req.params.id, userId);
    res.json(updated);
  });

  router.post('/:id/notifications', (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!canView(ticket, req)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    setNotifyPreference(req.params.id, req.activityUser.userId, Boolean(req.body.enabled)).then((updated) =>
      res.json(updated)
    );
  });

  router.post('/:id/claim', requireStaff, async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const updated = await claimTicket(req.params.id, actorFromReq(req));
    res.json(updated);
  });

  router.post('/:id/unclaim', requireStaff, async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const updated = await unclaimTicket(req.params.id);
    res.json(updated);
  });

  router.post('/:id/close', requireStaff, async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const updated = await closeTicket(req.params.id, actorFromReq(req));
    res.json(updated);
  });

  router.post('/:id/transcript', requireStaff, async (req, res) => {
    const ticket = getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const lines = [
      `Ticket: ${ticket.title} (${ticket.category})`,
      `Creado por: ${ticket.creatorTag} (${ticket.creatorId})`,
      `Estado: ${ticket.status}`,
      `Descripción: ${ticket.description}`,
      '',
      '--- Conversación ---',
      ...ticket.messages.map((m) => `[${m.createdAt}] ${m.authorTag}: ${m.content}${m.images.length ? ` (${m.images.length} imagen/es)` : ''}`),
    ];

    try {
      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
      const member = await guild.members.fetch(req.activityUser.userId);
      const buffer = Buffer.from(lines.join('\n'), 'utf8');
      await member.send({
        content: `Transcripción del ticket **${ticket.title}**`,
        files: [{ attachment: buffer, name: `ticket-${ticket.id}.txt` }],
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: `No se pudo enviar la transcripción por MD: ${err.message}` });
    }
  });

  return router;
}
