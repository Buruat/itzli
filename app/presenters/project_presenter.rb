class ProjectPresenter < ApplicationPresenter
  delegate :id, :name, :created_at, :updated_at, to: :model

  def data_main
    {
      id:,
      name:
    }
  end
end
