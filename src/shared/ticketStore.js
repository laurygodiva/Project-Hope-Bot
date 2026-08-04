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
    notifyOptOut: [],
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
  const optOut = new Set(ticket.notifyOptOut || []);
  if (enabled) optOut.delete(userId);
  else optOut.add(userId);
  ticket.notifyOptOut = [...optOut];
  await saveTickets(tickets);
  return ticket;
}

export function getTicketParticipantIds(ticket) {
  const ids = new Set([ticket.creatorId]);
  if (ticket.claimedBy?.id) ids.add(ticket.claimedBy.id);
  for (const m of ticket.messages) ids.add(m.authorId);
  return ids;
}
