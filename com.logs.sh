#!/usr/bin/env bash
# Muestra los logs del contenedor en tiempo real (Ctrl+C para salir)
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose logs -f --tail=100 app
