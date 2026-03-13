class TaskPresenter < ApplicationPresenter
  delegate :id, :name, :description, :task_type, :time_spent, :estimated_time, :deadline_date, :project_id, :created_at, :updated_at, to: :model

  def data_main
    {
      id:,
      name:,
      description:,
      task_type:,
      time_spent:,
      estimated_time:,
      deadline_date:,
      project_id:,
      created_at:,
      updated_at:
    }
  end
end
