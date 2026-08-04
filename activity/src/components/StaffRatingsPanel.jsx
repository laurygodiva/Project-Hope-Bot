import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const CATEGORY_LABEL = { soporte: 'Soporte', reporte: 'Reporte', ck: 'CK', playmaker: 'Solicitar Playmaker' };
const STAR_COLORS = ['#6b7280', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const STAFF_PALETTE = ['#5b66ff', '#8632f2', '#60d5e8', '#f5c518', '#ef4444', '#22c55e', '#f97316', '#ec4899'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function StaffRatingsPanel() {
  const [ratings, setRatings] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('stars');
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    api
      .get('/guild/ratings')
      .then(setRatings)
      .catch((err) => setError(err.message));
  }, []);

  const buckets = useMemo(() => {
    if (!ratings) return [];
    if (mode === 'stars') {
      return [0, 1, 2, 3, 4, 5].map((n) => ({
        key: String(n),
        label: `${n} estrella${n === 1 ? '' : 's'}`,
        color: STAR_COLORS[n],
        items: ratings.filter((r) => r.stars === n),
      }));
    }
    const byStaff = new Map();
    ratings.forEach((r) => {
      const key = r.staffId || 'unknown';
      if (!byStaff.has(key)) byStaff.set(key, { key, label: r.staffTag, items: [] });
      byStaff.get(key).items.push(r);
    });
    return [...byStaff.values()]
      .sort((a, b) => b.items.length - a.items.length)
      .map((b, i) => ({ ...b, color: STAFF_PALETTE[i % STAFF_PALETTE.length] }));
  }, [ratings, mode]);

  const total = ratings?.length || 0;
  const nonEmpty = buckets.filter((b) => b.items.length > 0);

  const gradient = useMemo(() => {
    if (total === 0) return null;
    let acc = 0;
    const stops = nonEmpty.map((b) => {
      const start = (acc / total) * 100;
      acc += b.items.length;
      const end = (acc / total) * 100;
      return `${b.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [nonEmpty, total]);

  if (error) return <p className="error-text">{error}</p>;
  if (!ratings) return null;

  return (
    <section className="guide-box">
      <div className="member-stats-header">
        <h2>Valoraciones del staff</h2>
        <div className="mode-toggle">
          <button type="button" className={mode === 'stars' ? 'active' : ''} onClick={() => setMode('stars')}>
            Por valoración
          </button>
          <button type="button" className={mode === 'staff' ? 'active' : ''} onClick={() => setMode('staff')}>
            Por staff
          </button>
        </div>
      </div>

      {total === 0 ? (
        <p className="muted">Todavía no hay valoraciones.</p>
      ) : (
        <div className="ratings-chart-layout">
          <div className="ratings-donut" style={{ background: gradient }}>
            <div className="ratings-donut-hole">
              <strong>{total}</strong>
              <span className="muted">total</span>
            </div>
          </div>

          <ul className="ratings-legend">
            {nonEmpty.map((b) => (
              <li key={b.key}>
                <button type="button" className="ratings-legend-row" onClick={() => setOpenKey((k) => (k === b.key ? null : b.key))}>
                  <span className="ratings-legend-swatch" style={{ background: b.color }} />
                  <span className="ratings-legend-label">{openKey === b.key ? '▾' : '▸'} {b.label}</span>
                  <span className="muted">{b.items.length}</span>
                </button>
                {openKey === b.key && (
                  <div className="ratings-legend-details">
                    {b.items.map((r) => (
                      <div key={r.ticketId + r.ratedAt} className="ratings-entry">
                        <div className="ratings-entry-row">
                          <strong>{r.title}</strong>
                          <span className="ticket-rating-stars small">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                        </div>
                        <span className="muted">
                          {CATEGORY_LABEL[r.category] || r.category} · Ticket del {formatDate(r.ticketCreatedAt)}
                        </span>
                        <span className="muted">Staff valorado: {r.staffTag}</span>
                        {r.comment && <p className="message-log-content">{r.comment}</p>}
                        <span className="muted">Valorado el {formatDate(r.ratedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
