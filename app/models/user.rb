class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_one_attached :photo

  normalizes :phone, with: -> phone { phone.gsub(/\s+/, "") }

  validates :username, presence: true, uniqueness: true
  validates :phone, presence: true, uniqueness: true
end
