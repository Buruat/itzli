Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      namespace :auth do
        post "register", to: "registrations#create"
        post "login",    to: "sessions#create"
        delete "logout", to: "sessions#destroy"
        get "me",        to: "users#me"
      end

      resources :projects
      resources :tasks
    end
  end
end
