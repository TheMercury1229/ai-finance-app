import { PrismaClient } from "@prisma/client";
//@ts-ignore
export const db = (globalThis.prisma as PrismaClient) || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  // @ts-ignore
  globalThis.prisma = db;
}
