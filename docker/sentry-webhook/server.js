const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');

const app = express();
app.use(express.json());

function verifySignature(req) {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!secret) return true; // пропустить проверку если секрет не задан
  const sig = req.headers['sentry-hook-signature'];
  const digest = crypto.createHmac('sha256', secret)
    .update(JSON.stringify(req.body)).digest('hex');
  return sig === digest;
}

app.post('/webhook/sentry', (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { action, data } = req.body;

  // Обрабатываем только новые issues
  if (action !== 'created') return res.json({ ok: true });

  const issue = data?.issue;
  if (!issue) return res.json({ ok: true });

  const issueId  = issue.id;
  const issueUrl = issue.permalink || issue.web_url || '';

  res.json({ ok: true }); // быстрый ответ Sentry

  // Запускаем claude в фоне
  setImmediate(() => {
    const prompt = `Use the claude-subagent-itzli agent to fix Sentry issue.
Issue ID: ${issueId}
Issue URL: ${issueUrl}
Check that branch fix/sentry-${issueId} does not already exist before starting.`;

    const tmpScript = `/tmp/claude-fix-${issueId}.sh`;
    fs.writeFileSync(tmpScript,
      `#!/bin/bash\ncd /app\nexec claude -p ${JSON.stringify(prompt)} ` +
      `--allowedTools Read,Write,Edit,Bash,Glob,Grep,Agent ` +
      `--permission-mode bypassPermissions\n`,
      { mode: 0o755 }
    );

    try {
      execSync(`su -l claudebot -c "bash ${tmpScript}"`, {
        stdio: 'inherit',
        env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN }
      });
    } catch (e) {
      console.error('[sentry-webhook] claude завершился с ошибкой:', e.message);
    } finally {
      fs.unlinkSync(tmpScript);
    }
  });
});

app.listen(4567, () => console.log('[sentry-webhook] слушаю :4567'));
