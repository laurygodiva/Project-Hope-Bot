import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useIdentity } from '../../context/IdentityContext.jsx';

const GROUP_LABELS = {
  faccion: 'Facción del infractor',
  intencion: 'Intención',
  impacto: 'Afectados',
};

export default function AggravatorsManager() {
  const { isSanctionsManager } = useIdentity();
  const [aggravators, setAggravators] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/sanctions/aggravators')
      .then(setAggravators)
      .catch((err) => setError(err.message));
  }, []);

  function setDelta(group, value, delta) {
    setAggravators((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        deltaByValue: { ...prev[group].deltaByValue, [value]: delta },
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await api.put('/sanctions/aggravators', aggravators);
      setAggravators(saved);
      setFeedback({ type: 'ok', text: 'Agravantes guardados.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!aggravators) return null;

  return (
    <div className="send-message-page">
      <div className="gradient-frame">
        <div className="embed-fields">
          <p className="muted">
            Configura cuántos puntos de severidad suma (o resta) cada valor de cada agravante al calcular una sanción.
          </p>
          {!isSanctionsManager && (
            <p className="muted">Solo el staff con el rol autorizado puede modificar los agravantes.</p>
          )}
          {Object.entries(aggravators)
            .filter(([key]) => GROUP_LABELS[key])
            .map(([group, def]) => (
              <div key={group} className="catalog-table">
                <span className="field-title catalog-col-heading">{GROUP_LABELS[group]}</span>
                {def.options.map((value) => (
                  <label key={value} className="catalog-row">
                    <span className="catalog-title">{value}</span>
                    <input
                      type="number"
                      value={def.deltaByValue[value]}
                      disabled={!isSanctionsManager}
                      onChange={(e) => setDelta(group, value, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
            ))}
          {isSanctionsManager && (
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar agravantes'}
            </button>
          )}
          {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
        </div>
      </div>
    </div>
  );
}
