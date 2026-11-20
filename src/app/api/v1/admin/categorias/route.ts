import { db } from "@/db";
import { categorias } from "@/db/schema";
import { asc } from "drizzle-orm";
import { exigirAdmin, ok, rota } from "@/server/http";

export const GET = rota(async (req) => {
  await exigirAdmin(req);
  return ok(await db.select().from(categorias).orderBy(asc(categorias.ordem)));
});
