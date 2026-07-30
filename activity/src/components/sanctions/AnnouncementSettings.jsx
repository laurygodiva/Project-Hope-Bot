import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function AnnouncementSettings() {
  const [template, setTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/sanctions/settings')
      .then((data) => setTemplate(data.dmTemplate))
      .catch((err) => setError(err.message));
  }, []);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await api.put('/sanctions/settings', { dmTemplate: template });
      setFeedback({ type: 'ok', text: 'Plantilla guardada.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="send-message-page">
      <div className="gradient-frame">
        <div className="embed-fields">
          <label>
            <span className="field-title">Mensaje que recibe por MD el usuario sancionado</span>
            <textarea rows={6} value={template} onChange={(e) => setTemplate(e.target.value)} />
          </label>
          <p className="muted">
            Puedes usar: <code>{'{usuario}'}</code> (mención), <code>{'{sanciones}'}</code> (tipos aplicados), <code>{'{duracion}'}</code>{' '}
            (duración o "Permanente"). Si se deja vacío, no se enviará ningún MD.
          </p>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar plantilla'}
          </button>
          {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
        </div>
      </div>
    </div>
  );
}
