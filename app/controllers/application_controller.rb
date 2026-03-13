class ApplicationController < ActionController::API
  include Authentication
  include Pundit::Authorization

  rescue_from Pundit::NotAuthorizedError, with: :forbidden

  private

  def current_user
    Current.user
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
