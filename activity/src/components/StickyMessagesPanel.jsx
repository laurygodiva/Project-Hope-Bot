import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function emptyEdit() {
  return {
    content: '',
    messageType: 'text',
    embedTitle: '',
    embedDescription: '',
    embedColor: '#5b66ff',
    embedFooter: '',
  };
}

export default function StickyMessagesPanel({ channelId, refreshKey }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(emptyEdit());
  const [saving, setSaving] = useState(false);

  function load() {
    if (!channelId) return;
    api
      .get(`/guild/channels/${channelId}/sticky`)
      .then(setMessages)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [channelId, refreshKey]);

  function startEdit(msg) {
    setEditingId(msg.messageId);
    setEdit({
      content: msg.content || '',
      messageType: msg.messageType,
      embedTitle: msg.embed?.title || '',
      embedDescription: msg.embed?.description || '',
      embedColor: msg.embed?.color || '#5b66ff',
      embedFooter: msg.embed?.footer || '',
    });
  }

  async function saveEdit(messageId) {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/guild/channels/${channelId}/sticky/${messageId}`, {
        content: edit.content,
        messageType: edit.messageType,
        embed:
          edit.messageType === 'embed'
            ? { title: edit.embedTitle, description: edit.embedDescription, color: edit.embedColor, footer: edit.embedFooter }
            : undefined,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(messageId) {
    try {
      await api.delete(`/guild/channels/${channelId}/sticky/${messageId}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="gradient-frame">
      <div className="embed-fields sticky-panel">
        <span className="field-title catalog-col-heading">Mensajes fijados en este canal</span>
        {error && <p className="error-text">{error}</p>}
        {!messages && !error && <p className="muted">Cargando...</p>}
        {messages?.length === 0 && <p className="muted">No hay mensajes fijados en este canal.</p>}

        {messages?.map((msg) => (
          <div key={msg.messageId} className="sticky-item">
            {editingId === msg.messageId ? (
              <div className="sticky-edit-form">
                {edit.messageType === 'text' ? (
                  <textarea rows={3} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Título"
                      value={edit.embedTitle}
                      onChange={(e) => setEdit({ ...edit, embedTitle: e.target.value })}
                    />
                    <textarea
                      rows={3}
                      placeholder="Descripción"
                      value={edit.embedDescription}
                      onChange={(e) => setEdit({ ...edit, embedDescription: e.target.value })}
                    />
                    <input type="color" value={edit.embedColor} onChange={(e) => setEdit({ ...edit, embedColor: e.target.value })} />
                    <textarea
                      rows={2}
                      placeholder="Texto adicional"
                      value={edit.content}
                      onChange={(e) => setEdit({ ...edit, content: e.target.value })}
                    />
                  </>
                )}
                <div className="color-generator-actions">
                  <button type="button" className="btn-primary" onClick={() => saveEdit(msg.messageId)} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="sticky-item-preview">
                  {msg.messageType === 'embed' ? msg.embed?.title || msg.embed?.description || '(embed sin texto)' : msg.content || '(vacío)'}
                </p>
                <div className="catalog-actions">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(msg)}>
                    Editar
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => handleDelete(msg.messageId)}>
                    Borrar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
