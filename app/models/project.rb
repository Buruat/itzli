class Project < ApplicationRecord
  acts_as_paranoid

  has_one_attached :image

  validates :name, presence: true, uniqueness: true

  def self.presenter
    ProjectPresenter
  end
end
