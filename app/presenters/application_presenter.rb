class ApplicationPresenter
  def initialize(model)
    @model = model
  end

  def data_errors
    model.errors.messages
  end

  private

  attr_reader :model
end
