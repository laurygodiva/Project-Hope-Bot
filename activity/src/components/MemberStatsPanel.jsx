import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const RANGES = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
];

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

  return (
    <div className="gradient-frame">
      <section className="guide-box member-stats">
        <div className="member-stats-header">
          <div>
            <span className="field-title catalog-col-heading">Miembros totales</span>
            <h2 className="member-stats-total">{stats ? stats.totalMembers : '—'}</h2>
            {stats && <p className="muted">Eventos registrados: {stats.totalEventsLogged}</p>}
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
          <div className="member-stats-chart">
            {series.map((s) => {
              const joinPct = (s.joins / maxValue) * 100;
              const leavePct = (s.leaves / maxValue) * 100;
              return (
                <div key={s.key} className="stats-bucket">
                  <div className="stats-bars">
                    <div className="stats-bar-col">
                      {s.joins > 0 && <span className="stats-bar-value">{s.joins}</span>}
                      <div className="bar-join" style={{ height: `${joinPct}%` }} />
                    </div>
                    <div className="stats-bar-col">
                      {s.leaves > 0 && <span className="stats-bar-value">{s.leaves}</span>}
                      <div className="bar-leave" style={{ height: `${leavePct}%` }} />
                    </div>
                  </div>
                  <span className="stats-bucket-label">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
