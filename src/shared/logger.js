const levels = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', success: '\x1b[32m' };
const reset = '\x1b[0m';

function log(level, scope, message) {
  const color = levels[level] || '';
  console.log(`${color}[${level.toUpperCase()}]${reset} [${scope}] ${message}`);
}

export const logger = {
  info: (scope, message) => log('info', scope, message),
  warn: (scope, message) => log('warn', scope, message),
  error: (scope, message) => log('error', scope, message),
  success: (scope, message) => log('success', scope, message),
};
