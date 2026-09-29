// Sustituto del logging de Python + QtLogHandler: guarda las líneas y avisa a
// los suscriptores (la consola) de cada nueva entrada.
const lines = []
const listeners = new Set()

function timestamp() {
  return new Date().toTimeString().slice(0, 8)
}

function emit(level, message) {
  const line = `${timestamp()} [${level}] ${message}`
  lines.push(line)
  const log = level === 'ERROR' ? console.error : level === 'WARNING' ? console.warn : console.info
  log(line)
  listeners.forEach((listener) => listener(lines))
}

export const logger = {
  info: (message) => emit('INFO', message),
  warning: (message) => emit('WARNING', message),
  error: (message) => emit('ERROR', message),
  subscribe(listener) {
    listeners.add(listener)
    listener(lines)
    return () => listeners.delete(listener)
  },
}
