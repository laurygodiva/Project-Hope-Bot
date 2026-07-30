// Motor de cálculo de sanciones: severidad base del catálogo + agravantes
// (facción, intención, impacto) => severidad final, tipo de castigo, duración
// automática y coste en PDR. Config estructural fija (no editable desde la
// Activity); lo que sí es editable es el CATÁLOGO de tipos de sanción.

export const SEVERITY_MAP = {
  1: { label: 'Aviso', autoRole: false, autoDurationIso: 'PT0S', pdrCost: 3 },
  2: { label: 'Sanción', autoRole: false, autoDurationIso: 'PT0S', pdrCost: 7 },
  3: { label: 'Baneo 3d', autoRole: true, autoDurationIso: 'P3D', pdrCost: 15 },
  4: { label: 'Baneo 5d', autoRole: true, autoDurationIso: 'P5D', pdrCost: 15 },
  5: { label: 'Baneo 7d', autoRole: true, autoDurationIso: 'P7D', pdrCost: 15 },
  6: { label: 'PermaBan', autoRole: false, autoDurationIso: null, pdrCost: 0, permanent: true },
};

export const AGGRAVATORS = {
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
    label: 'Impacto (múltiple)',
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

export function computeDecision(entry, ctx) {
  const sevBase = Number(entry.severidad_base || 0);
  if (!sevBase) throw new Error(`Entrada ${entry.id} sin severidad_base`);

  let sev = sevBase;
  sev += AGGRAVATORS.faccion.deltaByValue[ctx.faccion] ?? 0;
  sev += AGGRAVATORS.intencion.deltaByValue[ctx.intencion] ?? 0;
  for (const i of ctx.impacto || []) sev += AGGRAVATORS.impacto.deltaByValue[i] ?? 0;

  sev = clamp(sev, AGGRAVATORS.boundsMin, AGGRAVATORS.boundsMax);

  const info = SEVERITY_MAP[sev];
  const autoMs = info.permanent ? 0 : parseISODurationToMs(info.autoDurationIso);

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
    pdr: info.pdrCost,
    auto: {
      enabled: !!info.autoRole || (sev >= 3 && sev <= 5),
      iso: info.autoDurationIso,
      ms: autoMs,
      ends_at_iso: autoMs > 0 ? msToISOEnd(autoMs) : null,
      permanent: !!info.permanent,
    },
    acciones_manuales: entry.acciones_manuales || [],
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
