// Registro en memoria (no persistido) de Lore Quizz activos: el canal de
// Discord ya sirve como historial visual, así que solo necesitamos recordar,
// mientras el bot esté vivo, cuál es la respuesta correcta de cada mensaje
// para poder validar reacciones y anunciar al ganador.
const activeQuizzes = new Map(); // messageId -> { correctEmote, firstReactionByUser: Map, resolved }

export function registerQuiz(messageId, correctEmote) {
  activeQuizzes.set(messageId, { correctEmote, firstReactionByUser: new Map(), resolved: false });
}

export function getQuiz(messageId) {
  return activeQuizzes.get(messageId) || null;
}
