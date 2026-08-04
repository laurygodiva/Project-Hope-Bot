// Registro en memoria (no persistido): el canal de Discord ya sirve como
// historial visual, así que solo necesitamos recordar, mientras el bot esté
// vivo, la respuesta correcta de cada quiz activo para validar el desplegable.
const activeQuizzes = new Map(); // messageId -> { correctIndex, firstAnswerByUser: Map, resolved }

export function registerQuiz(messageId, correctIndex) {
  activeQuizzes.set(messageId, { correctIndex, firstAnswerByUser: new Map(), resolved: false });
}

export function getQuiz(messageId) {
  return activeQuizzes.get(messageId) || null;
}
