import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable field validators
// ---------------------------------------------------------------------------

const emailField = z
  .string({ required_error: "Email wajib diisi" })
  .email("Format email tidak valid")
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: "Password wajib diisi" })
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf kapital")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
  .regex(/[@$!%*?&]/, "Password harus mengandung minimal 1 karakter spesial (@$!%*?&)");

const descriptionField = z
  .string({ required_error: "Deskripsi wajib diisi" })
  .min(10, "Deskripsi minimal 10 karakter")
  .trim();

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Nama wajib diisi" })
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .trim(),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string({ required_error: "Konfirmasi password wajib diisi" }),
    role_id: z
      .string({ required_error: "Role wajib dipilih" })
      .uuid("Role tidak valid"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Report schemas
// ---------------------------------------------------------------------------

export const createReportBaseSchema = z.object({
  description: descriptionField,
  work_start: z
    .string({ required_error: "Waktu mulai wajib diisi" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Format waktu mulai tidak valid" }),
  work_end: z
    .string({ required_error: "Waktu selesai wajib diisi" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Format waktu selesai tidak valid" }),
});

export const createReportSchema = createReportBaseSchema.refine(
  (data) => new Date(data.work_end) > new Date(data.work_start),
  {
    message: "Waktu selesai harus lebih besar dari waktu mulai",
    path: ["work_end"],
  }
);

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = createReportBaseSchema.partial();
export type UpdateReportInput = z.infer<typeof updateReportSchema>;

// ---------------------------------------------------------------------------
// Admin schemas
// ---------------------------------------------------------------------------

export const updateReportStatusSchema = z.object({
  reportId: z.string().uuid("Report ID tidak valid"),
  status: z.enum(["approved", "rejected"], {
    required_error: "Status wajib dipilih",
    invalid_type_error: "Status tidak valid",
  }),
  reason: z
    .string()
    .max(500, "Alasan maksimal 500 karakter")
    .optional()
    .nullable(),
}).refine(
  (data) => data.status !== "rejected" || (data.reason && data.reason.length > 0),
  { message: "Alasan reject wajib diisi", path: ["reason"] }
);

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("User ID tidak valid"),
  roleId: z.string().uuid("Role ID tidak valid"),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const createRoleSchema = z.object({
  name: z
    .string({ required_error: "Nama role wajib diisi" })
    .min(2, "Nama role minimal 2 karakter")
    .max(50, "Nama role maksimal 50 karakter")
    .toUpperCase()
    .trim()
    .regex(/^[A-Z_]+$/, "Nama role hanya boleh menggunakan huruf kapital dan underscore"),
  label: z
    .string({ required_error: "Label role wajib diisi" })
    .min(2, "Label minimal 2 karakter")
    .max(100, "Label maksimal 100 karakter")
    .trim(),
  permissionIds: z
    .array(z.string().uuid("Permission ID tidak valid"))
    .min(1, "Minimal 1 permission harus dipilih"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// ---------------------------------------------------------------------------
// Pagination & filter query params
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, parseInt(v ?? "20", 10) || 20))),
});

export const reportFilterSchema = paginationSchema.extend({
  role:      z.string().optional(),
  status:    z.enum(["pending", "approved", "rejected"]).optional(),
  search:    z.string().optional(),
  date_from: z.string().optional(),
  date_to:   z.string().optional(),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;

// ---------------------------------------------------------------------------
// User Profile Schema
// ---------------------------------------------------------------------------

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .trim()
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .email("Format email tidak valid")
      .toLowerCase()
      .trim()
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf kapital")
      .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
      .regex(/[@$!%*?&]/, "Password harus mengandung minimal 1 karakter spesial (@$!%*?&)")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== "") {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Konfirmasi password tidak cocok",
      path: ["confirmPassword"],
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
