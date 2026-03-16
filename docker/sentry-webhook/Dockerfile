FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm git curl jq ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# gh CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) \
      signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
      https://cli.github.com/packages stable main" \
      | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Claude CLI для Linux
RUN npm install -g @anthropic-ai/claude-code

# Non-root пользователь (bypassPermissions запрещён для root)
RUN useradd -m -s /bin/bash claudebot

COPY docker/sentry-webhook/package.json /webhook/package.json
RUN cd /webhook && npm install

COPY docker/sentry-webhook/server.js /webhook/server.js
COPY docker/sentry-webhook/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app
ENTRYPOINT ["/entrypoint.sh"]
