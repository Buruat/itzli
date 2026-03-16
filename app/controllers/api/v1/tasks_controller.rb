module Api
  module V1
    class TasksController < ApplicationController
      before_action :set_task, only: %i[show update destroy]

      def index
        authorize Task
        scope = params[:project_id].present? ? Task.where(project_id: params[:project_id]) : Task.all
        render json: present_as_json(scope, :tasks, :data_main)
      end

      def show
        authorize @task
        render json: present_as_json(@task, :task, :data_main)
      end

      def create
        @task = Task.new(task_params)
        authorize @task
        @task.save
        render json: present_as_json(@task, :errors, :data_errors), status: :created
      end

      def update
        authorize @task
        @task.update(task_params)
        render json: present_as_json(@task, :errors, :data_errors)
      end

      def destroy
        authorize @task
        @task.destroy
        head :ok
      end

      private

      def set_task
        @task = Task.find(params[:id])
      end

      def task_params
        params.require(:task).permit(:name, :description, :task_type, :time_spent, :estimated_time, :deadline_date, :project_id)
      end
    end
  end
end
