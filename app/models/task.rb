class Task < ApplicationRecord
  acts_as_paranoid

  belongs_to :project, optional: true

  def self.presenter
    TaskPresenter
  end

  enum :task_type, { bug: 0, task: 1 }

  validates :name, presence: true, uniqueness: true
  validates :task_type, presence: true
end
