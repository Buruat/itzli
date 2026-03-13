module Api
  module V1
    module Auth
      class UsersController < ApplicationController
        def me
          render json: {
            user: {
              id: current_user.id,
              username: current_user.username,
              phone: current_user.phone,
              photo_url: current_user.photo.attached? ? rails_blob_path(current_user.photo, only_path: true) : nil
            }
          }
        end
      end
    end
  end
end
