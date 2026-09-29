# Entorno de desarrollo: Node LTS + Vite/React (deps del proyecto) + Claude Code
FROM node:24-bookworm

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends git less procps curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Directorios que se montan como volúmenes: se crean con dueño "node" para que
# los volúmenes nombrados hereden los permisos correctos al crearse.
RUN mkdir -p /workspace/node_modules /home/node/.claude /home/node/.npm-global \
    && chown -R node:node /workspace /home/node

COPY .devcontainer/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER node

# Paquetes npm globales en el home del usuario (permite que Claude Code se autoactualice)
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=/home/node/.npm-global/bin:$PATH
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace
EXPOSE 5555

CMD ["/usr/local/bin/entrypoint.sh"]
