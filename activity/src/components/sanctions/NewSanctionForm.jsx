import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useIdentity } from '../../context/IdentityContext.jsx';
import UserPicker from './UserPicker.jsx';
import SanctionLineEditor from './SanctionLineEditor.jsx';

function emptyLine() {
  return { catalogId: null, faccion: 'civil', intencion: 'negligente', impacto: [], isStaff: false };
}

export default function NewSanctionForm({ catalog }) {
  const { user } = useIdentity();
  const [targetUser, setTargetUser] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const readyLines = lines.filter((l) => l.catalogId);

  useEffect(() => {
    if (readyLines.length === 0) {
      setPreview(null);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .post('/sanctions/preview', { lineas: readyLines, targetId: targetUser?.id })
        .then((data) => {
          setPreview(data);
          setPreviewError(null);
        })
        .catch((err) => setPreviewError(err.message));
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(readyLines), targetUser?.id]);

  async function handleApply() {
    if (!targetUser || readyLines.length === 0) return;
    setSending(true);
    setFeedback(null);
    try {
      await api.post('/sanctions/apply', {
        targetId: targetUser.id,
        targetName: targetUser.displayName,
        moderatorId: user?.id,
        moderatorName: user?.username,
        lineas: readyLines,
      });
      setFeedback({ type: 'ok', text: 'Sanción aplicada correctamente.' });
      setTargetUser(null);
      setLines([emptyLine()]);
      setPreview(null);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="send-message-layout">
      <div className="send-form">
        <label>
          <span className="field-title">Usuario a sancionar</span>
          <UserPicker value={targetUser} onChange={setTargetUser} />
        </label>

        {previewError && <p className="error-text">{previewError}</p>}

        {preview?.agg && (
          <div className="gradient-frame">
            <div className="embed-fields sanction-summary">
              <strong>Resumen</strong>
              <p>
                {preview.agg.hasPerma ? 'PermaBan' : `${preview.agg.total_days} día(s) de baneo`} · {preview.agg.totalPdr} PDR total
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-primary btn-block"
          disabled={sending || !targetUser || readyLines.length === 0}
          onClick={handleApply}
        >
          {sending ? 'Aplicando...' : 'Aplicar sanción'}
        </button>

        {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
      </div>

      <aside className="send-message-sidebar">
        <span className="field-title">Sanciones</span>
        {lines.map((line, i) => (
          <SanctionLineEditor
            key={i}
            catalog={catalog}
            line={line}
            decision={preview?.decisiones?.find((d, di) => di === i && d.id === line.catalogId)}
            onChange={(next) => setLines((prev) => prev.map((l, li) => (li === i ? next : l)))}
            onRemove={() => setLines((prev) => prev.filter((_, li) => li !== i))}
          />
        ))}

        <button type="button" className="btn-secondary" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
          + Añadir sanción
        </button>
      </aside>
    </div>
  );
}
