-- SEEDER DATA UNTUK MANAGE SERVICE (FIXED UUID)
SET FOREIGN_KEY_CHECKS = 0;

-- 2. SEED PERMISSIONS
REPLACE INTO permissions (id, name, description, created_at) VALUES
('662b6671-55e1-4c6e-8a60-569b91754001', 'create_report', 'Membuat laporan kerja baru', NOW()),
('662b6671-55e1-4c6e-8a60-569b91754002', 'view_own_reports', 'Melihat laporan milik sendiri', NOW()),
('662b6671-55e1-4c6e-8a60-569b91754003', 'view_all_reports', 'Melihat semua laporan karyawan', NOW()),
('662b6671-55e1-4c6e-8a60-569b91754004', 'manage_users', 'Mengelola data pengguna', NOW()),
('662b6671-55e1-4c6e-8a60-569b91754005', 'manage_roles', 'Mengelola role dan permission', NOW()),
('662b6671-55e1-4c6e-8a60-569b91754006', 'export_pdf', 'Mengekspor laporan ke PDF', NOW()),
('662b6671-55e1-4c6e-8a60-569b91754007', 'update_report_status', 'Mengubah status laporan', NOW());

-- 3. SEED ROLES
REPLACE INTO roles (id, name, label, is_active, created_at, updated_at) VALUES
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', 'ADMIN', 'Administrator', 1, NOW(), NOW()),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a2', 'QUALITY_ASSURANCE', 'Quality Assurance', 1, NOW(), NOW()),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a3', 'FRONTEND_DEVELOPER', 'Frontend Developer', 1, NOW(), NOW()),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a4', 'BACKEND_DEVELOPER', 'Backend Developer', 1, NOW(), NOW()),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a5', 'UIUX_DESIGNER', 'UI/UX Designer', 1, NOW(), NOW()),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a6', 'PROJECT_MANAGER', 'Project Manager', 1, NOW(), NOW()),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a7', 'DEVOPS_ENGINEER', 'DevOps Engineer', 1, NOW(), NOW());

-- 4. SEED ROLE_PERMISSIONS (MAPPING)
DELETE FROM role_permissions;
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Admin
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754001'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754002'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754003'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754004'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754005'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754006'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', '662b6671-55e1-4c6e-8a60-569b91754007'),
-- PM
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a6', '662b6671-55e1-4c6e-8a60-569b91754001'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a6', '662b6671-55e1-4c6e-8a60-569b91754002'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a6', '662b6671-55e1-4c6e-8a60-569b91754003'),
-- Other roles (FE, BE, etc)
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a2', '662b6671-55e1-4c6e-8a60-569b91754001'), ('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a2', '662b6671-55e1-4c6e-8a60-569b91754002'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a3', '662b6671-55e1-4c6e-8a60-569b91754001'), ('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a3', '662b6671-55e1-4c6e-8a60-569b91754002'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a4', '662b6671-55e1-4c6e-8a60-569b91754001'), ('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a4', '662b6671-55e1-4c6e-8a60-569b91754002'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a5', '662b6671-55e1-4c6e-8a60-569b91754001'), ('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a5', '662b6671-55e1-4c6e-8a60-569b91754002'),
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a7', '662b6671-55e1-4c6e-8a60-569b91754001'), ('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a7', '662b6671-55e1-4c6e-8a60-569b91754002');

-- 5. SEED ADMIN USER
REPLACE INTO users (id, name, email, password, role_id, created_at, updated_at) VALUES
('b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a0', 'Administrator', 'admin@example.com', '$2a$10$7zBv4VpB4D6I6yM4r.A8IuUj/3j6L7E/m.6t0f7o1yH2W3r4z5u6i', 'b3a3b3a3-b3a3-4b3a-b3a3-b3a3b3a3b3a1', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
