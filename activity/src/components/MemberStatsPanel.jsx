import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const RANGES = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
];

const CHART_HEIGHT = 160;
const CHART_BOTTOM = 20;

export default function MemberStatsPanel() {
  const [range, setRange] = useState('day');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/guild/stats?range=${range}`)
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [range]);

  if (error) return <p className="error-text">{error}</p>;

  const series = stats?.series || [];
  const maxValue = Math.max(1, ...series.flatMap((s) => [s.joins, s.leaves]));
  const barWidth = series.length ? 100 / series.length : 0;

  return (
    <div className="gradient-frame">
      <section className="guide-box member-stats">
        <div className="member-stats-header">
          <div>
            <span className="field-title catalog-col-heading">Miembros totales</span>
            <h2 className="member-stats-total">{stats ? stats.totalMembers : '—'}</h2>
          </div>
          <div className="mode-toggle">
            {RANGES.map((r) => (
              <button key={r.id} type="button" className={range === r.id ? 'active' : ''} onClick={() => setRange(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="member-stats-legend">
          <span className="legend-item">
            <span className="legend-dot legend-join" /> Entradas
          </span>
          <span className="legend-item">
            <span className="legend-dot legend-leave" /> Salidas
          </span>
        </div>

        {series.length > 0 && (
          <>
            <svg className="member-stats-chart" viewBox={`0 0 100 ${CHART_HEIGHT}`} preserveAspectRatio="none">
              {series.map((s, i) => {
                const x = i * barWidth;
                const joinHeight = (s.joins / maxValue) * (CHART_HEIGHT - CHART_BOTTOM);
                const leaveHeight = (s.leaves / maxValue) * (CHART_HEIGHT - CHART_BOTTOM);
                return (
                  <g key={s.key}>
                    <rect
                      x={x + barWidth * 0.15}
                      y={CHART_HEIGHT - CHART_BOTTOM - joinHeight}
                      width={barWidth * 0.3}
                      height={joinHeight}
                      className="bar-join"
                      rx="1"
                    />
                    <rect
                      x={x + barWidth * 0.55}
                      y={CHART_HEIGHT - CHART_BOTTOM - leaveHeight}
                      width={barWidth * 0.3}
                      height={leaveHeight}
                      className="bar-leave"
                      rx="1"
                    />
                  </g>
                );
              })}
            </svg>
            <div className="member-stats-labels">
              {series.map((s) => (
                <span key={s.key}>{s.label}</span>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
