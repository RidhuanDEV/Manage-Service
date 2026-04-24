import 'dotenv/config'
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_ROOT_PASSWORD,
  connectionLimit: 10,
});
const prisma = new PrismaClient({
  adapter,
});
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERMISSIONS = [
  { name: "create_report",       description: "Membuat laporan kerja baru" },
  { name: "view_own_reports",    description: "Melihat laporan milik sendiri" },
  { name: "view_all_reports",    description: "Melihat semua laporan karyawan" },
  { name: "manage_users",        description: "Mengelola data pengguna" },
  { name: "manage_roles",        description: "Mengelola role dan permission" },
  { name: "export_pdf",          description: "Mengekspor laporan ke PDF" },
  { name: "update_report_status",description: "Mengubah status laporan" },
];

const ROLES: {
  name: string;
  label: string;
  permissions: string[];
}[] = [
  {
    name: "ADMIN",
    label: "Administrator",
    permissions: [
      "create_report",
      "view_own_reports",
      "view_all_reports",
      "manage_users",
      "manage_roles",
      "export_pdf",
      "update_report_status",
    ],
  },
  {
    name: "QUALITY_ASSURANCE",
    label: "Quality Assurance",
    permissions: ["create_report", "view_own_reports"],
  },
  {
    name: "FRONTEND_DEVELOPER",
    label: "Frontend Developer",
    permissions: ["create_report", "view_own_reports"],
  },
  {
    name: "BACKEND_DEVELOPER",
    label: "Backend Developer",
    permissions: ["create_report", "view_own_reports"],
  },
  {
    name: "UIUX_DESIGNER",
    label: "UI/UX Designer",
    permissions: ["create_report", "view_own_reports"],
  },
  {
    name: "PROJECT_MANAGER",
    label: "Project Manager",
    permissions: ["create_report", "view_own_reports", "view_all_reports"],
  },
  {
    name: "DEVOPS_ENGINEER",
    label: "DevOps Engineer",
    permissions: ["create_report", "view_own_reports"],
  },
];




// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Permissions
  console.log("  → Seeding permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }

  // 2. Roles + permission mapping
  console.log("  → Seeding roles...");
  for (const role of ROLES) {
    const upsertedRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { label: role.label },
      create: { name: role.name, label: role.label },
    });

    // Clear existing mappings then re-assign (idempotent)
    await prisma.rolePermission.deleteMany({
      where: { role_id: upsertedRole.id },
    });

    for (const permName of role.permissions) {
      const perm = await prisma.permission.findUniqueOrThrow({
        where: { name: permName },
      });
      await prisma.rolePermission.create({
        data: { role_id: upsertedRole.id, permission_id: perm.id },
      });
    }
  }

  // 3. Admin user
  console.log("  → Seeding admin user...");
  const adminName     = process.env.SEED_ADMIN_NAME     ?? "Administrator";
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });
  const hashedAdmin = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedAdmin,
      role_id: adminRole.id,
    },
  });


  console.log("✅ Seed selesai.");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })