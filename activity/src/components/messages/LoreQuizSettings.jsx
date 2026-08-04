import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useIdentity } from '../../context/IdentityContext.jsx';

export default function LoreQuizSettings() {
  const { isFounder } = useIdentity();
  const [settings, setSettings] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    api
      .get('/guild/lore-quiz/settings')
      .then(setSettings)
      .catch(() => {});
  }, []);

  if (!isFounder) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!iconFile && !imageFile) return;
    setSending(true);
    setFeedback(null);
    try {
      const form = new FormData();
      if (iconFile) form.append('icon', iconFile);
      if (imageFile) form.append('image', imageFile);
      const updated = await api.postForm('/guild/lore-quiz/settings', form);
      setSettings(updated);
      setIconFile(null);
      setImageFile(null);
      setFeedback({ type: 'ok', text: 'Guardado.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gradient-frame">
      <div className="guide-box">
        <form onSubmit={handleSubmit} className="lore-quiz-settings-form">
          <label>
            <span className="field-title">Icono circular</span>
            {settings?.iconURL && <img src={settings.iconURL} alt="" className="lore-quiz-settings-preview icon" />}
            <input type="file" accept="image/*" className="file-input-btn" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
          </label>

          <label>
            <span className="field-title">Imagen externa (antes del embed)</span>
            {settings?.imageURL && <img src={settings.imageURL} alt="" className="lore-quiz-settings-preview" />}
            <input type="file" accept="image/*" className="file-input-btn" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>

          <button type="submit" className="btn-secondary" disabled={sending || (!iconFile && !imageFile)}>
            {sending ? 'Guardando...' : 'Guardar'}
          </button>

          {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
        </form>
      </div>
    </div>
  );
}
