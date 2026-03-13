class ApplicationController < ActionController::API
  private

  def present_as_json(resource, key, method)
    data = if resource.is_a?(Array) || resource.is_a?(ActiveRecord::Relation)
      resource.map { |item| item.present.public_send(method) }
    else
      resource.present.public_send(method)
    end

    { key => data }
  end
end
