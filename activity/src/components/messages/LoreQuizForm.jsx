import { useState } from 'react';
import { api } from '../../api/client.js';

const NUMBER_EMOTES = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

export default function LoreQuizForm() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(NUMBER_EMOTES.map((emote) => ({ emote, text: '' })));
  const [correctEmote, setCorrectEmote] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function updateAnswer(emote, text) {
    setAnswers((prev) => prev.map((a) => (a.emote === emote ? { ...a, text } : a)));
  }

  const filledAnswers = answers.filter((a) => a.text.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      await api.post('/guild/lore-quiz', {
        question,
        answers: filledAnswers,
        correctEmote,
      });
      setFeedback({ type: 'ok', text: 'Lore Quizz enviado.' });
      setQuestion('');
      setAnswers(NUMBER_EMOTES.map((emote) => ({ emote, text: '' })));
      setCorrectEmote('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  const canSend = question.trim() && filledAnswers.length >= 2 && correctEmote && filledAnswers.some((a) => a.emote === correctEmote);

  return (
    <form onSubmit={handleSubmit} className="send-form lore-quiz-form">
      <label>
        <span className="field-title">Título</span>
        <input type="text" value="Lore Quizz" disabled />
      </label>

      <label>
        <span className="field-title">Pregunta</span>
        <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} required />
      </label>

      <div className="gradient-frame">
        <fieldset className="embed-fields">
          <span className="field-title">Respuestas</span>
          {NUMBER_EMOTES.map((emote) => (
            <label key={emote} className="lore-quiz-answer-row">
              <span className="lore-quiz-emote">{emote}</span>
              <input
                type="text"
                value={answers.find((a) => a.emote === emote).text}
                onChange={(e) => updateAnswer(emote, e.target.value)}
                placeholder="Respuesta (déjalo vacío para no usarla)..."
              />
            </label>
          ))}

          <label>
            <span className="field-title">Respuesta correcta</span>
            <select value={correctEmote} onChange={(e) => setCorrectEmote(e.target.value)}>
              <option value="">Selecciona...</option>
              {filledAnswers.map((a) => (
                <option key={a.emote} value={a.emote}>
                  {a.emote} {a.text}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      </div>

      <button type="submit" className="btn-primary btn-block" disabled={sending || !canSend}>
        {sending ? 'Enviando...' : 'Enviar Lore Quizz'}
      </button>

      {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
    </form>
  );
}
