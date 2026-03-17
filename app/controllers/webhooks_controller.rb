class WebhooksController < ApplicationController
  skip_before_action :require_authentication

  def sentry
    return head :unauthorized unless valid_signature?

    body = JSON.parse(request.raw_post) rescue {}
    return render json: { ok: true } if body["action"] != "created"

    issue = body.dig("data", "issue")
    return render json: { ok: true } unless issue

    SentryFixJob.perform_later(issue["id"].to_s, issue["permalink"].to_s)
    render json: { ok: true }
  end

  private

  def valid_signature?
    secret = ENV["SENTRY_WEBHOOK_SECRET"]
    return true if secret.blank?

    sig = request.headers["Sentry-Hook-Signature"]
    digest = OpenSSL::HMAC.hexdigest("sha256", secret, request.raw_post)
    ActiveSupport::SecurityUtils.secure_compare(sig.to_s, digest)
  end
end
