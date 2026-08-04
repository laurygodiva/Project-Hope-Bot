import { getTickets } from './ticketStore.js';
import { getCases } from './sanctionsStore.js';

// 1★ y 0★ se tratan igual de mal: no hay una valoración "0 estrellas"
// definida explícitamente, pero conceptualmente es al menos tan mala como 1.
const STAR_POINTS = { 0: -2, 1: -2, 2: -1, 3: 0, 4: 1, 5: 2 };

function monthKeyOf(iso) {
  if (!iso) return null;
  return iso.slice(0, 7); // "YYYY-MM"
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function getAvailableMonths() {
  const months = new Set();
  for (const t of getTickets()) {
    if (t.rating?.ratedAt) months.add(monthKeyOf(t.rating.ratedAt));
  }
  for (const c of getCases()) {
    if (c.createdAt) months.add(monthKeyOf(c.createdAt));
  }
  return [...months].filter(Boolean).sort((a, b) => (a < b ? 1 : -1));
}

export function computeStaffRanking(monthKey) {
  const staff = new Map();

  function entry(id, tag, avatar) {
    if (!staff.has(id)) {
      staff.set(id, { staffId: id, tag, avatar, points: 0, ratingPoints: 0, ratingsCount: 0, sanctionsPoints: 0, sanctionsCount: 0 });
    }
    const e = staff.get(id);
    if (tag) e.tag = tag;
    if (avatar) e.avatar = avatar;
    return e;
  }

  for (const t of getTickets()) {
    if (!t.rating || !t.claimedBy) continue;
    if (monthKeyOf(t.rating.ratedAt) !== monthKey) continue;
    const pts = STAR_POINTS[t.rating.stars] ?? 0;
    const e = entry(t.claimedBy.id, t.claimedBy.tag, t.claimedBy.avatar);
    e.ratingPoints += pts;
    e.ratingsCount += 1;
    e.points += pts;
  }

  for (const c of getCases()) {
    if (!c.moderatorId) continue;
    if (monthKeyOf(c.createdAt) !== monthKey) continue;
    const e = entry(c.moderatorId, c.moderatorName, null);
    e.sanctionsPoints += 1;
    e.sanctionsCount += 1;
    e.points += 1;
  }

  return [...staff.values()].sort((a, b) => b.points - a.points);
}
