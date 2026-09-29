#!/usr/bin/env bash
set -u

cd /workspace

if [ ! -f package.json ]; then
    echo "[entrypoint] No hay package.json en /workspace. Contenedor en espera."
    exec sleep infinity
fi

# Instala dependencias solo si cambian package.json / package-lock.json
HASH_FILE=node_modules/.install-hash
current_hash() { cat package.json package-lock.json 2>/dev/null | sha256sum | cut -d' ' -f1; }

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$(current_hash)" ]; then
    echo "[entrypoint] Instalando dependencias..."
    npm install && current_hash > "$HASH_FILE"
fi

echo "[entrypoint] Arrancando Vite en http://localhost:5555"
npm run dev

# Si Vite se detiene, el contenedor sigue vivo para poder entrar por consola / VS Code
echo "[entrypoint] Vite se ha detenido. Contenedor en espera."
exec sleep infinity
