#!/usr/bin/env bash
# Construye (o reconstruye) la imagen del contenedor de desarrollo
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose build "$@"
