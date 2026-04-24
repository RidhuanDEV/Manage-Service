import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// ---------------------------------------------------------------------------
// Auth.js v5 config — Credentials provider + JWT strategy + RBAC
// ---------------------------------------------------------------------------

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          // Fetch user + role + permissions
          const user = await prisma.user.findFirst({
            where: {
              email,
              deleted_at: null, // exclude soft-deleted users
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

          if (!user || !user.role.is_active) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          const permissions = user.role.permissions.map(
            (rp) => rp.permission.name
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
          console.error("[Auth] authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // First login: embed role + permissions into JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose JWT data to client session
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as { id: string; name: string; label: string };
      if (token.permissions) session.user.permissions = token.permissions as string[];
      return session;
    },
  },

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Prevent stack traces from leaking to client
  logger: {
    error(error) {
      console.error("[NextAuth Error]", error);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
