import { getQueue, saveQueue, getCases, saveCases } from './sanctionsStore.js';
import { logger } from './logger.js';

async function markCaseCompleted(caseId) {
  const cases = getCases();
  const caseObj = cases.find((c) => c.id === caseId);
  if (!caseObj) return;
  caseObj.actions = caseObj.actions || {};
  caseObj.actions.role_removed = true;
  caseObj.actions.role_removed_at_iso = new Date().toISOString();
  await saveCases(cases);
}

export function startSanctionsScheduler(client, intervalMs = 30_000) {
  let ticking = false;

  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      const queue = getQueue();
      const now = Date.now();
      const pending = [];

      for (const task of queue) {
        const dueMs = Date.parse(task.endsAtISO);
        if (!Number.isFinite(dueMs) || dueMs > now) {
          pending.push(task);
          continue;
        }

        try {
          const guild = await client.guilds.fetch(task.guildId).catch(() => null);
          if (!guild) throw new Error('Guild no disponible');
          const member = await guild.members.fetch(task.userId).catch(() => null);
          if (member?.roles.cache.has(task.roleId)) {
            await member.roles.remove(task.roleId, task.reason || 'Fin de baneo automático');
          }
          await markCaseCompleted(task.caseId);
          logger.success('sanctions', `Rol retirado a ${task.userId} (caso ${task.caseId})`);
        } catch (err) {
          task.attempts = (task.attempts || 0) + 1;
          if (task.attempts < 5) {
            pending.push(task);
          } else {
            logger.error('sanctions', `Abandonando retirada de rol para ${task.userId} tras 5 intentos: ${err.message}`);
          }
        }
      }

      if (pending.length !== queue.length) {
        await saveQueue(pending);
      }
    } catch (err) {
      logger.error('sanctions', `Error en el scheduler: ${err.message}`);
    } finally {
      ticking = false;
    }
  }

  tick();
  setInterval(tick, intervalMs);
  logger.info('sanctions', `Scheduler de sanciones iniciado (cada ${intervalMs}ms)`);
}
