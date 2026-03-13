class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects, id: :uuid do |t|
      t.string :name, null: false
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :projects, :name, unique: true
    add_index :projects, :deleted_at
  end
end
