class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  def present
    self.class.presenter.new(self)
  end
end
