class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index? = user.present?
  def show? = user.present?
  def create? = user.present?
  def update? = user.present?
  def destroy? = user.present?
  def new? = create?
  def edit? = update?
end
