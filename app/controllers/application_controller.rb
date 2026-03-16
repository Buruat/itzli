class ApplicationController < ActionController::API
  include Authentication
  include Pundit::Authorization

  before_action :set_sentry_user_context
  rescue_from Pundit::NotAuthorizedError, with: :forbidden

  private

  def current_user
    Current.user
  end

  def set_sentry_user_context
    return unless current_user

    Sentry.set_user(id: current_user.id, username: current_user.username)
  end

  def forbidden
    render json: { error: "Forbidden" }, status: :forbidden
  end

  def present_as_json(resource, key, method)
    data = if resource.is_a?(Array) || resource.is_a?(ActiveRecord::Relation)
      resource.map { |item| item.present.public_send(method) }
    else
      resource.present.public_send(method)
    end

    { key => data }
  end
end
