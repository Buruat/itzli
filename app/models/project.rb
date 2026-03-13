class Project < ApplicationRecord
  acts_as_paranoid

  validates :name, presence: true, uniqueness: true

  def self.presenter
    ProjectPresenter
  end
end
