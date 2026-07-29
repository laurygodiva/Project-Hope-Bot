import { ActivityType } from 'discord.js';

const RESET_HOURS = [7, 17, 23];
const ROTATE_INTERVAL_MS = 4000;

function timeUntilNextReset() {
  const now = new Date();
  const todayResets = RESET_HOURS.map((h) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0));
  const allResets = [...todayResets, ...todayResets.map((d) => new Date(d.getTime() + 86400000))];
  const next = allResets.find((d) => d > now);
  const diffMs = next - now;
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${hours} horas y ${minutes} minutos`;
}

function toStyledDigits(str) {
  return str.replace(/\d/g, (d) => String.fromCodePoint(0x1d7ce + Number(d)));
}

const presences = [
  {
    dynamicCount: true,
    activities: [{ name: 'Usuarios en Discord:', type: ActivityType.Watching, state: '' }],
    status: 'online',
  },
  {
    dynamicReset: true,
    activities: [{ name: 'Próximo Reinicio:', type: ActivityType.Listening, state: '' }],
    status: 'online',
  },
];

export function startPresenceRotation(client) {
  let current = 0;

  async function rotate() {
    const cfg = presences[current];

    if (cfg.dynamicCount) {
      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
      const count = guild ? guild.memberCount : 0;
      cfg.activities[0].state = toStyledDigits(count.toString());
    } else if (cfg.dynamicReset) {
      cfg.activities[0].state = toStyledDigits(timeUntilNextReset());
    }

    try {
      await client.user.setPresence(cfg);
    } catch {
      // ignorar fallos puntuales de presencia
    }

    current = (current + 1) % presences.length;
    setTimeout(rotate, ROTATE_INTERVAL_MS);
  }

  rotate();
}
