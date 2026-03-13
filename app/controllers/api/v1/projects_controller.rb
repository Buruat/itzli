module Api
  module V1
    class ProjectsController < ApplicationController
      before_action :set_project, only: %i[show update destroy]

      def index
        authorize Project
        render json: present_as_json(Project.all, :projects, :data_main)
      end

      def show
        authorize @project
        render json: present_as_json(@project, :project, :data_main)
      end

      def create
        @project = Project.new(project_params)
        authorize @project
        @project.save
        render json: present_as_json(@project, :errors, :data_errors), status: :created
      end

      def update
        authorize @project
        @project.update(project_params)
        render json: present_as_json(@project, :errors, :data_errors)
      end

      def destroy
        authorize @project
        @project.destroy
        head :ok
      end

      private

      def set_project
        @project = Project.find(params[:id])
      end

      def project_params
        params.require(:project).permit(:name, :description, :image)
      end
    end
  end
end
