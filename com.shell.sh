#!/usr/bin/env bash
# Abre una consola bash dentro del contenedor (debe estar levantado)
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose exec app bash
