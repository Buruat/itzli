class CreateTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :tasks, id: :uuid do |t|
      t.string :name, null: false
      t.references :project, null: true, foreign_key: true, type: :uuid
      t.text :description
      t.integer :task_type, null: false, default: 0
      t.integer :time_spent
      t.integer :estimated_time
      t.date :deadline_date
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :tasks, :name, unique: true
    add_index :tasks, :deleted_at
  end
end
