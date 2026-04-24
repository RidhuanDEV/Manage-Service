import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// ---------------------------------------------------------------------------
// Prisma singleton — prevents multiple instances during Next.js hot reload
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host:            process.env.DB_HOST     ?? "127.0.0.1",
    port:            Number(process.env.DB_PORT ?? 3306),
    database:        process.env.DB_NAME     ?? "manage_service",
    user:            process.env.DB_USER     ?? "root",
    password:        process.env.DB_ROOT_PASSWORD ?? "",
    connectionLimit: 10,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
