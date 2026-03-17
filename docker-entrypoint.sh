#!/bin/bash
set -e

# bundle check || bundle install --jobs 4

# git для root
git config --global safe.directory /app
git config --global user.name "Claude Bot"
git config --global user.email "claude-bot@users.noreply.github.com"
git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"

# Копируем ~/.claude с хоста только при первом запуске
if [ ! -f /home/claudebot/.claude.json ] || ! grep -q '"oauthAccount"\|"oauthToken"\|"accessToken"' /home/claudebot/.claude.json 2>/dev/null; then
  rm -rf /home/claudebot/.claude
  cp -r /root/.claude /home/claudebot/.claude
  [ -f /root/.claude.json ] && cp /root/.claude.json /home/claudebot/.claude.json
  chown -R claudebot:claudebot /home/claudebot/.claude /home/claudebot/.claude.json 2>/dev/null || true
fi

# git для claudebot
su -l -s /bin/bash claudebot -c "
  git config --global safe.directory /app
  git config --global user.name 'Claude Bot'
  git config --global user.email 'claude-bot@users.noreply.github.com'
  git config --global url.\"https://${GITHUB_TOKEN}@github.com/\".insteadOf 'git@github.com:'
"

exec "$@"
