import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// ---------------------------------------------------------------------------
// Auth.js v5 config — Credentials provider + JWT strategy + RBAC
// ---------------------------------------------------------------------------

import { AuthError } from "next-auth";

class CustomAuthError extends AuthError {
  constructor(message: string) {
    super();
    this.type = message as any;
  }
}

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

const authConfig: NextAuthConfig = {
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError("Data kredensial tidak lengkap");
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          const user = await prisma.user.findFirst({
            where: {
              email,
              deleted_at: null, 
            },
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          });

          if (!user) {
            throw new CustomAuthError(
              "Email tidak terdaftar atau telah dihapus",
            );
          }

          if (!user.role.is_active) {
            throw new CustomAuthError("Role akun Anda sedang dinonaktifkan");
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            throw new CustomAuthError("Password yang Anda masukkan salah");
          }

          const permissions = user.role.permissions.map(
            (rp) => rp.permission.name,
          );

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: {
              id: user.role.id,
              name: user.role.name,
              label: user.role.label,
            },
            permissions,
          };
        } catch (error) {
          if (error instanceof CustomAuthError) {
            throw error;
          }
          console.error("[Auth] authorize error:", error);
          throw new CustomAuthError(
            "Terjadi kesalahan pada server, silakan hubungi administrator",
          );
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role)
        session.user.role = token.role as {
          id: string;
          name: string;
          label: string;
        };
      if (token.permissions)
        session.user.permissions = token.permissions as string[];
      return session;
    },
  },

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  logger: {
    error(error) {
      console.error("[NextAuth Error]", error);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
