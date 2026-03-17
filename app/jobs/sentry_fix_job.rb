class SentryFixJob < ApplicationJob
  queue_as :default

  def perform(issue_id, issue_url)
    prompt = "Use the claude-subagent-itzli agent to fix Sentry issue.\n" \
             "Issue ID: #{issue_id}\n" \
             "Issue URL: #{issue_url}\n" \
             "Check that branch fix/sentry-#{issue_id} does not already exist before starting."

    tmp_script = "/tmp/claude-fix-#{issue_id}.sh"

    File.open(tmp_script, "w", 0o755) do |f|
      f.write("#!/bin/bash\ncd /app\nexec claude -p #{JSON.generate(prompt)} " \
              "--allowedTools Read,Write,Edit,Bash,Glob,Grep,Agent " \
              "--permission-mode bypassPermissions\n")
    end
    
    system(
      { "GH_TOKEN" => ENV["GITHUB_TOKEN"] },
      "su -l claudebot -c 'bash #{tmp_script}'"
    )
  ensure
    File.delete(tmp_script) if File.exist?(tmp_script)
  end
end
