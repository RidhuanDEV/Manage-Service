# Manage Service — Web Laporan Karyawan

Aplikasi web internal untuk manajemen laporan kerja karyawan berbasis **Next.js 15 App Router** (fullstack).

---

## 📦 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 App Router (fullstack) |
| Auth | Auth.js v5 (NextAuth) — Credentials + JWT |
| Database | MySQL 8.x via Docker |
| ORM | Prisma 6.x |
| File Storage | MinIO (self-hosted S3-compatible) via Docker |
| PDF Export | pdfmake |
| State | Zustand (UI only) |
| Styling | Tailwind CSS (Neobrutalism theme) |
| Container | Docker + Docker Compose |

---

## 🚀 Cara Setup (Development)

### Prasyarat
- Node.js ≥ 20 LTS
- Docker Desktop

### 1. Clone & Install

```bash
git clone <repo-url>
cd my-app
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi lokal Anda
```

### 3. Jalankan Database & MinIO via Docker

```bash
docker compose up mysql minio -d
```

Tunggu sampai keduanya healthy (±30 detik).

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Buat tabel (jalankan migration)
npm run db:migrate
# Masukkan nama migration: init

# Isi data awal (permissions, roles, users, laporan dummy)
npm run db:seed
```

### 5. Inisialisasi Bucket MinIO

```bash
npm run minio:init
```

Buka MinIO Console di http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`) untuk verifikasi bucket `reports` sudah terbuat.

### 6. Jalankan Next.js

```bash
npm run dev
# Buka http://localhost:3000
```

---

## 🐳 Production (Docker Compose Penuh)

```bash
# 1. Setup env
cp .env.example .env
# Edit semua nilai — NEXTAUTH_SECRET wajib 32+ karakter random

# 2. Build dan jalankan
docker compose up -d --build

# 3. Setup database & seed (sekali saja)
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed

# 4. Init bucket MinIO (sekali saja)
docker compose exec app npm run minio:init
```

---

## 👤 Akun Default (setelah seed)

| Email | Password | Role |
|---|---|---|
| admin@example.com | Admin@12345 | ADMIN |
| dummy1@example.com | Password@123 | FRONTEND_DEVELOPER |
| dummy2@example.com | Password@123 | BACKEND_DEVELOPER |
| dummy3@example.com | Password@123 | QUALITY_ASSURANCE |
| dummy4@example.com | Password@123 | UIUX_DESIGNER |
| dummy5@example.com | Password@123 | PROJECT_MANAGER |

---

## 🔗 URL yang Tersedia

| URL | Deskripsi |
|---|---|
| http://localhost:3000 | Aplikasi utama |
| http://localhost:9001 | MinIO Console |
| http://localhost:3000/login | Halaman login |
| http://localhost:3000/register | Halaman register |
| http://localhost:3000/dashboard | Dashboard user |
| http://localhost:3000/reports/new | Buat laporan baru |
| http://localhost:3000/reports/[id] | Detail laporan |
| http://localhost:3000/reports/[id]/edit | Edit laporan (status pending) |
| http://localhost:3000/admin/reports | Admin — semua laporan + filter |
| http://localhost:3000/admin/users | Admin — kelola user |
| http://localhost:3000/admin/roles | Admin — kelola role & permission |

---

## 🗂️ Struktur Folder

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              [Client] Form login
│   │   └── register/page.tsx           [Server] Form register
│   ├── (dashboard)/
│   │   ├── layout.tsx                  [Server] Sidebar + auth guard
│   │   ├── dashboard/
│   │   │   ├── page.tsx                [Server] List laporan + stats
│   │   │   ├── loading.tsx             Skeleton loading
│   │   │   └── error.tsx               [Client] Error boundary
│   │   ├── reports/
│   │   │   ├── new/page.tsx            [Server shell] Form buat laporan
│   │   │   └── [id]/
│   │   │       ├── page.tsx            [Server] Detail laporan
│   │   │       ├── edit/page.tsx       [Server shell] Edit laporan
│   │   │       ├── loading.tsx         Skeleton loading
│   │   │       └── error.tsx           [Client] Error boundary
│   │   └── admin/
│   │       ├── layout.tsx              [Server] Guard manage_users permission
│   │       ├── reports/
│   │       │   ├── page.tsx            [Server] Semua laporan + filter
│   │       │   ├── loading.tsx         Skeleton loading
│   │       │   └── error.tsx           [Client] Error boundary
│   │       ├── users/
│   │       │   ├── page.tsx            [Server] Kelola user
│   │       │   ├── loading.tsx         Skeleton loading
│   │       │   └── error.tsx           [Client] Error boundary
│   │       └── roles/
│   │           ├── page.tsx            [Server] Kelola role + permission
│   │           ├── loading.tsx         Skeleton loading
│   │           └── error.tsx           [Client] Error boundary
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts Auth.js handler
│   │   ├── files/[...key]/route.ts     Serve file MinIO + auth + ownership
│   │   └── admin/reports/export-pdf/
│   │       └── route.ts                Stream PDF binary
│   ├── not-found.tsx                   Global 404 page
│   └── global-error.tsx                Root error boundary
├── actions/
│   ├── auth.actions.ts                 registerUser
│   ├── report.actions.ts               createReport, updateReport, deleteReport
│   └── admin.actions.ts                updateReportStatus, updateUserRole,
│                                       toggleUserStatus, CRUD roles & permissions
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx (+ Select, Textarea)
│   │   ├── Badge.tsx (+ StatusBadge)
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── FileUpload.tsx
│   │   └── PageError.tsx
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ReportForm.tsx
│   │   ├── ReportEditForm.tsx
│   │   └── DeleteReportButton.tsx
│   ├── admin/
│   │   ├── AdminReportFilter.tsx
│   │   ├── UpdateReportStatusModal.tsx
│   │   ├── UserControls.tsx
│   │   └── RoleControls.tsx
│   └── layouts/
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       └── SidebarToggleButton.tsx
├── lib/
│   ├── prisma.ts, minio.ts, auth.ts
│   ├── permissions.ts, pdf.ts
│   ├── validations.ts, response.ts
├── store/uiStore.ts
└── types/index.ts
```

---

## 🔐 Permission System

| Permission | Deskripsi |
|---|---|
| `create_report` | Buat laporan (semua role) |
| `view_own_reports` | Lihat laporan sendiri (semua role) |
| `view_all_reports` | Lihat semua laporan (PROJECT_MANAGER, ADMIN) |
| `manage_users` | Kelola user (ADMIN) |
| `manage_roles` | Kelola role & permission (ADMIN) |
| `export_pdf` | Export laporan ke PDF (ADMIN) |
| `update_report_status` | Approve/reject laporan (ADMIN) |

---

## 📝 Catatan Penting

- **File storage**: Semua gambar disimpan di MinIO, bukan di filesystem atau database.
- **Presigned URL**: Gambar di-serve via presigned URL (expire 1 jam) — tidak disimpan di DB.
- **Atomic upload**: Jika DB gagal setelah upload, file di MinIO otomatis dihapus (anti orphan).
- **Soft delete**: User dan Report tidak benar-benar dihapus dari DB (`deleted_at`).
- **RBAC**: Permission dicek di middleware, Server Component, dan Server Action (tiga lapis).
- **Session JWT**: Role + permissions disimpan di JWT — tidak ada DB query per request.
- **Rate limiting**: Login 20 req/15mnt, Register 15 req/jam — in-memory per instance.
