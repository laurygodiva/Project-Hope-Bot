import { Router } from 'express';
import { computeDecision, aggregateDecisions, SEVERITY_MAP } from '../../shared/sanctionsEngine.js';
import {
  getCatalog,
  saveCatalog,
  getCases,
  saveCases,
  getQueue,
  saveQueue,
  getSettings,
  saveSettings,
  getAggravators,
  saveAggravators,
} from '../../shared/sanctionsStore.js';
import { logger } from '../../shared/logger.js';
import { buildEmbed } from '../../shared/embedBuilder.js';

function findEntry(catalog, id) {
  return catalog.find((e) => String(e.id) === String(id));
}

function countPriorOccurrences(cases, catalogId, targetId, excludeCaseId) {
  let count = 0;
  for (const c of cases) {
    if (excludeCaseId && c.id === excludeCaseId) continue;
    if (c.archived) continue;
    if (c.targetId !== targetId) continue;
    if ((c.lineas || []).some((l) => String(l.catalogId) === String(catalogId))) count++;
  }
  return count;
}

function renderTemplate(template, { targetId, decisiones, agg }) {
  const sanciones = decisiones.map((d) => d.titulo).join(', ');
  const duracion = agg.hasPerma ? 'Permanente' : agg.totalMs > 0 ? `${agg.total_days} día(s)` : 'Sin baneo';
  return template
    .replaceAll('{usuario}', `<@${targetId}>`)
    .replaceAll('{sanciones}', sanciones)
    .replaceAll('{duracion}', duracion);
}

export function createSanctionsRouter(client) {
  const router = Router();

  function getGuild(res) {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) {
      res.status(500).json({ error: 'Servidor de Discord no disponible' });
      return null;
    }
    return guild;
  }

  router.get('/config', (req, res) => {
    res.json({ severityMap: SEVERITY_MAP, aggravators: getAggravators() });
  });

  router.get('/aggravators', (req, res) => {
    res.json(getAggravators());
  });

  router.put('/aggravators', async (req, res) => {
    const aggravators = req.body;
    if (!aggravators || !aggravators.faccion || !aggravators.intencion || !aggravators.impacto) {
      return res.status(400).json({ error: 'Faltan campos de agravantes (facción, intención, impacto)' });
    }
    await saveAggravators(aggravators);
    res.json(aggravators);
  });

  router.get('/catalog', (req, res) => {
    res.json(getCatalog());
  });

  router.post('/catalog', async (req, res) => {
    const catalog = getCatalog();
    const {
      id,
      familia,
      titulo,
      descripcion,
      severidad_base,
      tipo_base,
      acciones_manuales,
      pdr_cost,
      castigo_manual,
      severidad_base_staff,
      castigo_manual_staff,
      pdr_cost_staff,
      reiterado_limit,
    } = req.body;

    if (!id || !familia || !titulo || !severidad_base) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (id, familia, título, severidad base)' });
    }
    if (findEntry(catalog, id)) {
      return res.status(409).json({ error: 'Ya existe un tipo de sanción con ese identificador' });
    }

    const entry = {
      id: Number(id),
      familia,
      titulo,
      descripcion: descripcion || '',
      severidad_base: Number(severidad_base),
      tipo_base: tipo_base || SEVERITY_MAP[Number(severidad_base)]?.label || '',
      acciones_manuales: acciones_manuales || [],
      pdr_cost: pdr_cost != null && pdr_cost !== '' ? Number(pdr_cost) : null,
      castigo_manual: castigo_manual || '',
      severidad_base_staff: severidad_base_staff != null && severidad_base_staff !== '' ? Number(severidad_base_staff) : null,
      castigo_manual_staff: castigo_manual_staff || '',
      pdr_cost_staff: pdr_cost_staff != null && pdr_cost_staff !== '' ? Number(pdr_cost_staff) : null,
      reiterado_limit: reiterado_limit != null && reiterado_limit !== '' ? Number(reiterado_limit) : null,
    };
    catalog.push(entry);
    await saveCatalog(catalog);
    res.status(201).json(entry);
  });

  router.put('/catalog/:id', async (req, res) => {
    const catalog = getCatalog();
    const entry = findEntry(catalog, req.params.id);
    if (!entry) return res.status(404).json({ error: 'Tipo de sanción no encontrado' });

    const {
      familia,
      titulo,
      descripcion,
      severidad_base,
      tipo_base,
      acciones_manuales,
      pdr_cost,
      castigo_manual,
      severidad_base_staff,
      castigo_manual_staff,
      pdr_cost_staff,
      reiterado_limit,
    } = req.body;
    if (familia !== undefined) entry.familia = familia;
    if (titulo !== undefined) entry.titulo = titulo;
    if (descripcion !== undefined) entry.descripcion = descripcion;
    if (severidad_base !== undefined) entry.severidad_base = Number(severidad_base);
    if (tipo_base !== undefined) entry.tipo_base = tipo_base;
    if (acciones_manuales !== undefined) entry.acciones_manuales = acciones_manuales;
    if (pdr_cost !== undefined) entry.pdr_cost = pdr_cost != null && pdr_cost !== '' ? Number(pdr_cost) : null;
    if (castigo_manual !== undefined) entry.castigo_manual = castigo_manual;
    if (severidad_base_staff !== undefined)
      entry.severidad_base_staff = severidad_base_staff != null && severidad_base_staff !== '' ? Number(severidad_base_staff) : null;
    if (castigo_manual_staff !== undefined) entry.castigo_manual_staff = castigo_manual_staff;
    if (pdr_cost_staff !== undefined)
      entry.pdr_cost_staff = pdr_cost_staff != null && pdr_cost_staff !== '' ? Number(pdr_cost_staff) : null;
    if (reiterado_limit !== undefined)
      entry.reiterado_limit = reiterado_limit != null && reiterado_limit !== '' ? Number(reiterado_limit) : null;

    await saveCatalog(catalog);
    res.json(entry);
  });

  router.delete('/catalog/:id', async (req, res) => {
    const catalog = getCatalog();
    const next = catalog.filter((e) => String(e.id) !== String(req.params.id));
    if (next.length === catalog.length) return res.status(404).json({ error: 'Tipo de sanción no encontrado' });
    await saveCatalog(next);
    res.json({ ok: true });
  });

  router.post('/preview', (req, res) => {
    const catalog = getCatalog();
    const { lineas, targetId } = req.body;
    if (!Array.isArray(lineas) || lineas.length === 0) {
      return res.status(400).json({ error: 'Añade al menos una línea de sanción' });
    }

    try {
      const aggravators = getAggravators();
      const cases = getCases();
      const decisiones = lineas.map((ln) => {
        const entry = findEntry(catalog, ln.catalogId);
        if (!entry) throw new Error(`Tipo de sanción ${ln.catalogId} no encontrado`);
        const priorCount = targetId ? countPriorOccurrences(cases, ln.catalogId, targetId) : 0;
        return computeDecision(
          entry,
          { faccion: ln.faccion, intencion: ln.intencion, impacto: ln.impacto || [], isStaff: !!ln.isStaff, priorCount },
          aggravators
        );
      });
      const agg = aggregateDecisions(decisiones);
      res.json({ decisiones, agg });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/cases', (req, res) => {
    const cases = getCases();
    const userId = req.query.userId;
    const search = (req.query.search || '').toString().trim().toLowerCase();
    let filtered = userId ? cases.filter((c) => c.targetId === userId) : cases;
    if (search) {
      filtered = filtered.filter(
        (c) => (c.targetName || '').toLowerCase().includes(search) || (c.targetId || '').includes(search)
      );
    }
    res.json(filtered.slice(-100).reverse());
  });

  router.put('/cases/:id', async (req, res) => {
    const catalog = getCatalog();
    const cases = getCases();
    const caseObj = cases.find((c) => c.id === req.params.id);
    if (!caseObj) return res.status(404).json({ error: 'Caso no encontrado' });

    const { targetName, lineas, manualApplied, archived } = req.body;
    if (targetName !== undefined) caseObj.targetName = targetName;
    if (manualApplied !== undefined) caseObj.manualApplied = !!manualApplied;
    if (archived !== undefined) caseObj.archived = !!archived;

    if (Array.isArray(lineas) && lineas.length > 0) {
      try {
        const aggravators = getAggravators();
        const decisiones = lineas.map((ln) => {
          const entry = findEntry(catalog, ln.catalogId);
          if (!entry) throw new Error(`Tipo de sanción ${ln.catalogId} no encontrado`);
          const priorCount = countPriorOccurrences(cases, ln.catalogId, caseObj.targetId, caseObj.id);
          return computeDecision(
            entry,
            { faccion: ln.faccion, intencion: ln.intencion, impacto: ln.impacto || [], isStaff: !!ln.isStaff, priorCount },
            aggravators
          );
        });
        const agg = aggregateDecisions(decisiones);
        caseObj.lineas = lineas;
        caseObj.decisiones = decisiones;
        caseObj.total = { pdr: agg.totalPdr, auto_ms: agg.totalMs, ends_at_iso: agg.total_ends_at_iso, permaban: agg.hasPerma };
        caseObj.edited = true;
        caseObj.editedAt = new Date().toISOString();
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    await saveCases(cases);
    res.json(caseObj);
  });

  router.delete('/cases/:id', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const cases = getCases();
    const caseObj = cases.find((c) => c.id === req.params.id);
    if (!caseObj) return res.status(404).json({ error: 'Caso no encontrado' });

    // Revertir el castigo aplicado, si lo hubo
    try {
      if (caseObj.actions?.banned) {
        await guild.members.unban(caseObj.targetId, 'Sanción eliminada desde la Activity de administración').catch(() => {});
      } else if (caseObj.actions?.role_applied && process.env.SANCTIONS_ROLE_ID) {
        const member = await guild.members.fetch(caseObj.targetId).catch(() => null);
        if (member?.roles.cache.has(process.env.SANCTIONS_ROLE_ID)) {
          await member.roles.remove(process.env.SANCTIONS_ROLE_ID, 'Sanción eliminada desde la Activity de administración');
        }
      }
    } catch (err) {
      logger.error('sanctions', `No se pudo revertir el castigo al borrar el caso: ${err.message}`);
    }

    const queue = getQueue().filter((t) => t.caseId !== req.params.id);
    await saveQueue(queue);

    await saveCases(cases.filter((c) => c.id !== req.params.id));
    res.json({ ok: true });
  });

  router.get('/settings', (req, res) => {
    res.json(getSettings());
  });

  router.put('/settings', async (req, res) => {
    const { embed } = req.body;
    if (!embed || typeof embed !== 'object') return res.status(400).json({ error: 'Falta la plantilla de anuncio' });
    const settings = {
      embed: {
        title: embed.title || '',
        description: embed.description || '',
        color: embed.color || '#5b66ff',
        imageURL: embed.imageURL || '',
        thumbnailURL: embed.thumbnailURL || '',
        footer: embed.footer || '',
        footerIconURL: embed.footerIconURL || '',
      },
    };
    await saveSettings(settings);
    res.json(settings);
  });

  router.post('/apply', async (req, res) => {
    const guild = getGuild(res);
    if (!guild) return;

    const catalog = getCatalog();
    const { targetId, targetName, lineas, moderatorId, moderatorName } = req.body;
    if (!targetId || !Array.isArray(lineas) || lineas.length === 0) {
      return res.status(400).json({ error: 'Falta el usuario objetivo o las líneas de sanción' });
    }

    let decisiones;
    try {
      const aggravators = getAggravators();
      const cases0 = getCases();
      decisiones = lineas.map((ln) => {
        const entry = findEntry(catalog, ln.catalogId);
        if (!entry) throw new Error(`Tipo de sanción ${ln.catalogId} no encontrado`);
        const priorCount = countPriorOccurrences(cases0, ln.catalogId, targetId);
        return computeDecision(
          entry,
          { faccion: ln.faccion, intencion: ln.intencion, impacto: ln.impacto || [], isStaff: !!ln.isStaff, priorCount },
          aggravators
        );
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const agg = aggregateDecisions(decisiones);
    const actions = { role_applied: false, banned: false, errors: [] };
    const roleId = process.env.SANCTIONS_ROLE_ID;

    try {
      if (agg.hasPerma) {
        await guild.members.ban(targetId, { reason: `Permaban por sanciones aplicado por ${moderatorName || moderatorId}` });
        actions.banned = true;
      } else if (agg.totalMs > 0 && roleId) {
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (member) {
          await member.roles.add(roleId, `Baneo automático por sanciones aplicado por ${moderatorName || moderatorId}`);
          actions.role_applied = true;
        } else {
          actions.errors.push('No se pudo obtener el miembro (¿salió del servidor?)');
        }
      }
    } catch (err) {
      actions.errors.push(`Error aplicando castigo automático: ${err.message}`);
    }

    const settings = getSettings();
    if (settings.embed?.title || settings.embed?.description) {
      try {
        const member = await guild.members.fetch(targetId).catch(() => null);
        const ctx = { targetId, decisiones, agg };
        const renderedEmbed = {
          ...settings.embed,
          title: renderTemplate(settings.embed.title || '', ctx),
          description: renderTemplate(settings.embed.description || '', ctx),
          footer: renderTemplate(settings.embed.footer || '', ctx),
        };
        if (member) await member.send({ embeds: [buildEmbed(renderedEmbed)] });
      } catch (err) {
        actions.errors.push('No se pudo enviar el MD de aviso (puede tener los MD cerrados)');
      }
    }

    const createdAt = new Date().toISOString();
    const caseObj = {
      id: `${Date.now()}-${targetId}`,
      guildId: guild.id,
      moderatorId,
      moderatorName,
      targetId,
      targetName,
      createdAt,
      lineas,
      decisiones,
      total: { pdr: agg.totalPdr, auto_ms: agg.totalMs, ends_at_iso: agg.total_ends_at_iso, permaban: agg.hasPerma },
      actions,
      manualApplied: false,
      archived: false,
    };

    const cases = getCases();
    cases.push(caseObj);
    await saveCases(cases);

    if (!agg.hasPerma && agg.totalMs > 0 && roleId) {
      const endsAtISO = agg.total_ends_at_iso || new Date(Date.now() + agg.totalMs).toISOString();
      const queue = getQueue();
      queue.push({
        guildId: guild.id,
        userId: targetId,
        roleId,
        endsAtISO,
        caseId: caseObj.id,
        reason: 'Fin de baneo automático programado',
        attempts: 0,
      });
      await saveQueue(queue);
    }

    const logChannelId = process.env.SANCTIONS_LOG_CHANNEL_ID;
    if (logChannelId) {
      try {
        const ch = await client.channels.fetch(logChannelId).catch(() => null);
        if (ch?.isTextBased()) {
          const names = decisiones.map((d) => d.titulo).join(', ');
          const finText = agg.hasPerma ? 'Permanente' : agg.total_ends_at_iso ? `<t:${Math.floor(Date.parse(agg.total_ends_at_iso) / 1000)}:F>` : '—';
          await ch.send({
            embeds: [
              {
                title: 'Nueva sanción aplicada',
                color: 0x60d5e8,
                description: `Usuario: <@${targetId}>\nSanciones: ${names}`,
                fields: [
                  { name: 'Aplicada', value: `<t:${Math.floor(Date.parse(createdAt) / 1000)}:F>`, inline: true },
                  { name: 'Fin del castigo', value: finText, inline: true },
                  { name: 'Staff', value: moderatorId ? `<@${moderatorId}>` : '—', inline: true },
                ],
              },
            ],
          });
        }
      } catch (err) {
        logger.error('sanctions', `No se pudo enviar el log: ${err.message}`);
      }
    }

    res.json({ decisiones, agg, actions, case: caseObj });
  });

  return router;
}
