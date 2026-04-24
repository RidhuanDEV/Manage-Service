import type { DefaultSession } from "next-auth";

// ---------------------------------------------------------------------------
// NextAuth session type augmentation
// WAJIB: agar TypeScript tidak error saat akses session.user.role / .permissions
// ---------------------------------------------------------------------------
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: {
        id: string;
        name: string;
        label: string;
      };
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: {
      id: string;
      name: string;
      label: string;
    };
    permissions: string[];
  }

  interface JWT {
    id: string;
    role: {
      id: string;
      name: string;
      label: string;
    };
    permissions: string[];
  }
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type ActionResult<T = null> = {
  sukses: boolean;
  pesan: string;
  data?: T;
  kesalahan?: { kolom: string; pesan: string }[];
};

export type PaginationMeta = {
  halaman: number;
  batas: number;
  total: number;
  total_halaman: number;
};

export type ReportStatus = "pending" | "approved" | "rejected";

export type ReportFilters = {
  role?: string;
  status?: ReportStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

export type RoleWithPermissions = {
  id: string;
  name: string;
  label: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  permissions: {
    permission: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
};

export type UserWithRole = {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role: {
    id: string;
    name: string;
    label: string;
  };
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type ReportWithUser = {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: {
      name: string;
      label: string;
    };
  };
  before_image_key: string;
  after_image_key: string;
  description: string;
  work_start: Date;
  work_end: Date;
  status: string;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type CreateRoleInput = {
  name: string;
  label: string;
  permissionIds: string[];
};

export type UpdateRoleInput = Partial<CreateRoleInput>;
