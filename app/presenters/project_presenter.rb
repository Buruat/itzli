class ProjectPresenter < ApplicationPresenter
  include Rails.application.routes.url_helpers

  delegate :id, :name, :description, :created_at, :updated_at, to: :model

  def data_main
    {
      id:,
      name:,
      description:,
      image_url: model.image.attached? ? rails_blob_path(model.image, only_path: true) : nil
    }
  end
end
