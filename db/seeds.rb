# Create default admin user for developing
puts "Create default admin user"
Erp::User.create(
  email: "admin@hcmut.edu.vn",
  password: "aA456321@",
  name: "Quản Trị Viên",
  backend_access: true,
  confirmed_at: Time.now-1.day,
  active: true
) if Erp::User.where(email: "admin@hcmut.edu.vn").empty?
