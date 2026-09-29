#!/usr/bin/env bash
# Para y elimina el contenedor (los volúmenes node_modules y claude-config se conservan)
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose down "$@"
