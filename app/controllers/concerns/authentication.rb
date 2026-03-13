module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private

  def require_authentication
    Current.session = find_session_by_token
    render json: { error: "Unauthorized" }, status: :unauthorized unless Current.session
  end

  def find_session_by_token
    token = request.headers["Authorization"]&.delete_prefix("Bearer ")
    Session.find_by(token: token) if token.present?
  end

  def start_new_session_for(user)
    user.sessions.create!(
      user_agent: request.user_agent,
      ip_address: request.remote_ip
    ).tap { |session| Current.session = session }
  end

  def terminate_session
    Current.session.destroy
  end
end
