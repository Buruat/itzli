module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        allow_unauthenticated_access only: %i[create]

        def create
          user = User.find_by(phone: params[:phone])
          if user&.authenticate(params[:password])
            session = start_new_session_for(user)
            render json: { token: session.token, user: user_data(user) }
          else
            render json: { errors: { base: ["Неверный номер телефона или пароль"] } }, status: :unauthorized
          end
        end

        def destroy
          terminate_session
          head :ok
        end

        private

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
