#!/usr/bin/env bash
# Levanta el contenedor en segundo plano (web en http://localhost:5555)
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose up -d "$@"
echo "Web: http://localhost:5555  |  Logs: ./com.logs.sh"
