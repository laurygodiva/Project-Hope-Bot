import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TICKETS_PATH = path.join(DATA_DIR, 'tickets.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  ensureDir();
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  ensureDir();
  const tmp = `${file}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fsp.rename(tmp, file);
}

export function getTickets() {
  return readJson(TICKETS_PATH, []);
}

export function getTicket(id) {
  return getTickets().find((t) => t.id === id) || null;
}

async function saveTickets(tickets) {
  await writeJson(TICKETS_PATH, tickets);
}

export async function createTicket({ category, title, description, links, images, creator }) {
  const tickets = getTickets();
  const now = new Date().toISOString();
  const ticket = {
    id: crypto.randomUUID(),
    category,
    title,
    description,
    links: links || [],
    images: images || [],
    creatorId: creator.id,
    creatorTag: creator.tag,
    creatorAvatar: creator.avatar,
    status: 'new',
    claimedBy: null,
    messages: [],
    createdAt: now,
    lastMessageAt: now,
    closedAt: null,
    closedBy: null,
    notifyOptIn: [],
    lastReadBy: {},
    participants: [],
    rating: null,
  };
  tickets.push(ticket);
  await saveTickets(tickets);
  return ticket;
}

export async function addTicketMessage(id, { author, content, images }) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  const now = new Date().toISOString();
  const message = {
    id: crypto.randomUUID(),
    authorId: author.id,
    authorTag: author.tag,
    authorAvatar: author.avatar,
    content: content || '',
    images: images || [],
    createdAt: now,
  };
  ticket.messages.push(message);
  ticket.lastMessageAt = now;
  await saveTickets(tickets);
  return ticket;
}

export async function claimTicket(id, staff) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.status = 'claimed';
  ticket.claimedBy = staff;
  await saveTickets(tickets);
  return ticket;
}

export async function unclaimTicket(id) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.status = 'new';
  ticket.claimedBy = null;
  await saveTickets(tickets);
  return ticket;
}

export async function closeTicket(id, staff) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.status = 'closed';
  ticket.closedAt = new Date().toISOString();
  ticket.closedBy = staff;
  await saveTickets(tickets);
  return ticket;
}

export async function setNotifyPreference(id, userId, enabled) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  const optIn = new Set(ticket.notifyOptIn || []);
  if (enabled) optIn.add(userId);
  else optIn.delete(userId);
  ticket.notifyOptIn = [...optIn];
  await saveTickets(tickets);
  return ticket;
}

export async function markTicketRead(id, userId) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.lastReadBy = { ...(ticket.lastReadBy || {}), [userId]: new Date().toISOString() };
  await saveTickets(tickets);
  return ticket;
}

export async function deleteTicket(id) {
  const tickets = getTickets();
  const next = tickets.filter((t) => t.id !== id);
  if (next.length === tickets.length) return false;
  await saveTickets(next);
  return true;
}

export async function addParticipant(id, userId) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  const participants = new Set(ticket.participants || []);
  participants.add(userId);
  ticket.participants = [...participants];
  await saveTickets(tickets);
  return ticket;
}

export async function setTicketRating(id, { stars, comment }, raterId) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  if (ticket.rating) return ticket;
  ticket.rating = { stars, comment: comment || '', raterId, ratedAt: new Date().toISOString(), verified: false };
  await saveTickets(tickets);
  return ticket;
}

export async function setRatingVerified(id, verified) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket || !ticket.rating) return null;
  ticket.rating.verified = verified;
  await saveTickets(tickets);
  return ticket;
}

export async function deleteRating(id) {
  const tickets = getTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.rating = null;
  await saveTickets(tickets);
  return ticket;
}

export function getTicketParticipantIds(ticket) {
  const ids = new Set([ticket.creatorId]);
  if (ticket.claimedBy?.id) ids.add(ticket.claimedBy.id);
  for (const m of ticket.messages) ids.add(m.authorId);
  for (const p of ticket.participants || []) ids.add(p);
  return ids;
}

// Solo alguien involucrado en el ticket (lo creó, lo reclamó como staff, o
// fue añadido como participante) ve el aviso de "no leído", y solo si el
// último mensaje no es suyo (si fue el último en escribir, no hay nada pendiente).
export function hasUnreadForUser(ticket, viewerId) {
  const involved =
    ticket.creatorId === viewerId || ticket.claimedBy?.id === viewerId || (ticket.participants || []).includes(viewerId);
  if (!involved) return false;
  if (ticket.messages.length === 0) return false;
  const last = ticket.messages[ticket.messages.length - 1];
  if (last.authorId === viewerId) return false;
  const lastRead = ticket.lastReadBy?.[viewerId];
  return !lastRead || new Date(last.createdAt) > new Date(lastRead);
}
