import { useState } from 'react';
import { api } from '../../api/client.js';

export default function LoreQuizForm() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function updateAnswer(i, text) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? text : a)));
  }

  const filledAnswers = answers.map((text, i) => ({ text, originalIndex: i })).filter((a) => a.text.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const texts = filledAnswers.map((a) => a.text.trim());
      const correct = filledAnswers.findIndex((a) => a.originalIndex === Number(correctIndex));
      await api.post('/guild/lore-quiz', { question, answers: texts, correctIndex: correct });
      setFeedback({ type: 'ok', text: 'Lore Quizz enviado.' });
      setQuestion('');
      setAnswers(['', '', '', '', '', '']);
      setCorrectIndex('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  const canSend = question.trim() && filledAnswers.length >= 2 && correctIndex !== '' && answers[correctIndex]?.trim();

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
          <span className="field-title">Respuestas (hasta 6)</span>
          {answers.map((text, i) => (
            <label key={i}>
              <input type="text" value={text} onChange={(e) => updateAnswer(i, e.target.value)} placeholder={`Respuesta ${i + 1}...`} />
            </label>
          ))}

          <label>
            <span className="field-title">Respuesta correcta</span>
            <select value={correctIndex} onChange={(e) => setCorrectIndex(e.target.value)}>
              <option value="">Selecciona...</option>
              {filledAnswers.map((a) => (
                <option key={a.originalIndex} value={a.originalIndex}>
                  {a.text}
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
