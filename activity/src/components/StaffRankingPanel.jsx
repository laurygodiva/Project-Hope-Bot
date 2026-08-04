import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function monthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function StaffRankingPanel() {
  const [mode, setMode] = useState('current');
  const [months, setMonths] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/guild/staff-ranking/months')
      .then((data) => {
        setCurrentMonth(data.current);
        const history = data.months.filter((m) => m !== data.current);
        setMonths(history);
        if (history[0]) setSelectedMonth(history[0]);
      })
      .catch((err) => setError(err.message));
  }, []);

  const activeMonth = mode === 'current' ? currentMonth : selectedMonth;

  useEffect(() => {
    if (!activeMonth) {
      setRanking([]);
      return;
    }
    api
      .get(`/guild/staff-ranking?month=${activeMonth}`)
      .then((data) => setRanking(data.ranking))
      .catch((err) => setError(err.message));
  }, [activeMonth]);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <section className="guide-box">
      <div className="member-stats-header">
        <h2>Ranking de staff</h2>
        <div className="mode-toggle">
          <button type="button" className={mode === 'current' ? 'active' : ''} onClick={() => setMode('current')}>
            Actual
          </button>
          <button type="button" className={mode === 'history' ? 'active' : ''} onClick={() => setMode('history')}>
            Historial
          </button>
        </div>
      </div>

      {mode === 'current' && currentMonth && <p className="muted">{monthLabel(currentMonth)}</p>}

      {mode === 'history' && (
        <>
          {months?.length === 0 && <p className="muted">No hay meses anteriores todavía.</p>}
          {months?.length > 0 && (
            <select className="staff-ranking-month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {ranking?.length === 0 && <p className="muted">Sin puntos registrados este mes.</p>}

      <ol className="staff-ranking-list">
        {ranking?.map((r, i) => (
          <li key={r.staffId} className="staff-ranking-row">
            <span className="staff-ranking-position">#{i + 1}</span>
            <img src={r.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" />
            <div className="staff-ranking-info">
              <strong>{r.tag}</strong>
              <span className="muted">
                {r.ratingsCount} valoración{r.ratingsCount === 1 ? '' : 'es'} ({r.ratingPoints >= 0 ? '+' : ''}
                {r.ratingPoints}) · {r.sanctionsCount} sanción{r.sanctionsCount === 1 ? '' : 'es'} (+{r.sanctionsPoints})
              </span>
            </div>
            <span className={`staff-ranking-points ${r.points < 0 ? 'negative' : ''}`}>
              {r.points >= 0 ? '+' : ''}
              {r.points}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
