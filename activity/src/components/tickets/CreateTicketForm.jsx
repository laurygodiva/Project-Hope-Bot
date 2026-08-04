import { useState } from 'react';
import { api } from '../../api/client.js';

const CATEGORIES = [
  { id: 'soporte', label: 'Soporte' },
  { id: 'reporte', label: 'Reporte' },
  { id: 'ck', label: 'CK' },
  { id: 'playmaker', label: 'Solicitar Playmaker' },
];

export default function CreateTicketForm({ onCreated }) {
  const [category, setCategory] = useState('soporte');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linksText, setLinksText] = useState('');
  const [images, setImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const links = linksText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const form = new FormData();
      form.append('category', category);
      form.append('title', title);
      form.append('description', description);
      form.append('links', JSON.stringify(links));
      images.forEach((f) => form.append('images', f));

      const ticket = await api.postForm('/tickets', form);

      setTitle('');
      setDescription('');
      setLinksText('');
      setImages([]);
      setFeedback({ type: 'ok', text: 'Ticket creado correctamente.' });
      onCreated?.(ticket);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="send-form ticket-create-form">
      <label>
        <span className="field-title">Categoría</span>
        <div className="mode-toggle">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={category === c.id ? 'active' : ''} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </label>

      <label>
        <span className="field-title">Título</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
      </label>

      <label>
        <span className="field-title">Descripción</span>
        <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </label>

      <label>
        <span className="field-title">URLs externas (una por línea)</span>
        <textarea rows={3} value={linksText} onChange={(e) => setLinksText(e.target.value)} placeholder="https://..." />
      </label>

      <label>
        <span className="field-title">Imágenes (hasta 5, desde tu PC)</span>
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
        {images.length > 0 && <p className="muted">{images.length} imagen(es) seleccionada(s)</p>}
      </label>

      <button type="submit" className="btn-primary btn-block" disabled={sending}>
        {sending ? 'Creando...' : 'Crear ticket'}
      </button>

      {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
    </form>
  );
}
