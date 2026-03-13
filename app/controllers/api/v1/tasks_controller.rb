module Api
  module V1
    class TasksController < ApplicationController
      before_action :set_task, only: %i[show update destroy]

      def index
        render json: present_as_json(Task.all, :tasks, :data_main)
      end

      def show
        render json: present_as_json(@task, :task, :data_main)
      end

      def create
        @task = Task.new(task_params)
        @task.save
        render json: present_as_json(@task, :errors, :data_errors), status: :created
      end

      def update
        @task.update(task_params)
        render json: present_as_json(@task, :errors, :data_errors)
      end

      def destroy
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
