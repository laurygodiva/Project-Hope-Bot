// Motor de cálculo de sanciones: severidad base del catálogo + agravantes
// (facción, intención, impacto) => severidad final, tipo de castigo, duración
// automática y coste en PDR. La duración/etiqueta por nivel de severidad es
// fija; el catálogo (tipos) y los valores de los agravantes SÍ son editables
// desde la Activity.

export const SEVERITY_MAP = {
  1: { label: 'Aviso', autoRole: false, autoDurationIso: 'PT0S', pdrCost: 3 },
  2: { label: 'Sanción', autoRole: false, autoDurationIso: 'PT0S', pdrCost: 7 },
  3: { label: 'Baneo 3d', autoRole: true, autoDurationIso: 'P3D', pdrCost: 15 },
  4: { label: 'Baneo 5d', autoRole: true, autoDurationIso: 'P5D', pdrCost: 15 },
  5: { label: 'Baneo 7d', autoRole: true, autoDurationIso: 'P7D', pdrCost: 15 },
  6: { label: 'PermaBan', autoRole: false, autoDurationIso: null, pdrCost: 0, permanent: true },
};

export const DEFAULT_AGGRAVATORS = {
  faccion: {
    label: 'Facción del infractor',
    options: ['civil', 'ilegales', 'policial'],
    deltaByValue: { civil: 0, ilegales: 1, policial: 1 },
  },
  intencion: {
    label: 'Intención',
    options: ['involuntario', 'negligente', 'premeditado'],
    deltaByValue: { involuntario: -1, negligente: 0, premeditado: 1 },
  },
  impacto: {
    label: 'Afectados (múltiple)',
    multi: true,
    options: ['streamer', 'grupo_usuarios', 'staff'],
    deltaByValue: { streamer: 1, grupo_usuarios: 1, staff: 1 },
  },
  boundsMin: 1,
  boundsMax: 6,
};

function parseISODurationToMs(iso) {
  if (!iso) return 0;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!m) return 0;
  const d = Number(m[1] || 0);
  const h = Number(m[2] || 0);
  const mi = Number(m[3] || 0);
  const s = Number(m[4] || 0);
  return (((d * 24 + h) * 60 + mi) * 60 + s) * 1000;
}

function msToISOEnd(ms) {
  return !ms || ms <= 0 ? null : new Date(Date.now() + ms).toISOString();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function computeDecision(entry, ctx, aggravators = DEFAULT_AGGRAVATORS) {
  const isStaff = !!ctx.isStaff;
  const sevBaseRaw = isStaff && entry.severidad_base_staff ? entry.severidad_base_staff : entry.severidad_base;
  const sevBase = Number(sevBaseRaw || 0);
  if (!sevBase) throw new Error(`Entrada ${entry.id} sin severidad_base`);

  let sev = sevBase;
  sev += aggravators.faccion.deltaByValue[ctx.faccion] ?? 0;
  sev += aggravators.intencion.deltaByValue[ctx.intencion] ?? 0;
  for (const i of ctx.impacto || []) sev += aggravators.impacto.deltaByValue[i] ?? 0;

  sev = clamp(sev, aggravators.boundsMin, aggravators.boundsMax);

  const priorCount = Number(ctx.priorCount || 0);
  const reiterado = !!(entry.reiterado_limit && priorCount + 1 >= Number(entry.reiterado_limit));
  if (reiterado) sev = 6;

  const info = SEVERITY_MAP[sev];
  const autoMs = info.permanent ? 0 : parseISODurationToMs(info.autoDurationIso);
  const pdrOverride = isStaff && entry.pdr_cost_staff != null && entry.pdr_cost_staff !== '' ? entry.pdr_cost_staff : entry.pdr_cost;
  const pdr = pdrOverride != null && pdrOverride !== '' ? Number(pdrOverride) : info.pdrCost;
  const castigoManual = isStaff && entry.castigo_manual_staff ? entry.castigo_manual_staff : entry.castigo_manual || '';

  let tipoAgrupado = 'sanción';
  if (sev === 1) tipoAgrupado = 'aviso';
  else if (sev === 2) tipoAgrupado = 'sanción';
  else if (sev >= 3 && sev <= 5) tipoAgrupado = 'baneo';
  else if (sev === 6) tipoAgrupado = 'permaban';

  return {
    id: entry.id,
    familia: entry.familia,
    titulo: entry.titulo,
    descripcion: entry.descripcion || '',
    severidad_base: sevBase,
    severidad_final: sev,
    tipo_label: info.label,
    tipo_agrupado: tipoAgrupado,
    pdr,
    auto: {
      enabled: !!info.autoRole || (sev >= 3 && sev <= 5),
      iso: info.autoDurationIso,
      ms: autoMs,
      ends_at_iso: autoMs > 0 ? msToISOEnd(autoMs) : null,
      permanent: !!info.permanent,
    },
    castigo_manual: castigoManual,
    reiterado,
    isStaff,
    ctx,
  };
}

export function aggregateDecisions(decisions) {
  const hasPerma = decisions.some((d) => d.severidad_final === 6 || d.tipo_agrupado === 'permaban');
  const totalPdr = decisions.reduce((acc, d) => acc + (d.pdr || 0), 0);
  let totalMs = 0;
  for (const d of decisions) {
    if (d.tipo_agrupado === 'baneo') totalMs += d.auto.ms || 0;
  }
  return {
    hasPerma,
    totalPdr,
    totalMs,
    total_days: Math.round(totalMs / 86400000),
    total_ends_at_iso: hasPerma ? null : msToISOEnd(totalMs),
  };
}
