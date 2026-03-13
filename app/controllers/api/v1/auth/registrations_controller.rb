module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        allow_unauthenticated_access

        def create
          user = User.new(registration_params)
          if user.save
            session = start_new_session_for(user)
            render json: { token: session.token, user: user_data(user) }, status: :created
          else
            render json: { errors: user.errors.messages }, status: :unprocessable_entity
          end
        end

        private

        def registration_params
          params.require(:user).permit(:username, :phone, :password, :password_confirmation, :photo)
        end

        def user_data(user)
          {
            id: user.id,
            username: user.username,
            phone: user.phone,
            photo_url: user.photo.attached? ? rails_blob_path(user.photo, only_path: true) : nil
          }
        end
      end
    end
  end
end
