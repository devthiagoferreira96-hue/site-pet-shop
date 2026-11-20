import { ok, rota } from "@/server/http";
import { listarPublico } from "@/server/services/produtos";

/** GET /api/v1/produtos?categoria=racoes&q=coleira&pagina=1&ordem=nome|recentes */
export const GET = rota(async (req) => {
  const p = req.nextUrl.searchParams;
  const ordem = p.get("ordem") === "recentes" ? "recentes" : "nome";
  return ok(await listarPublico({
    categoria: p.get("categoria") ?? undefined, q: p.get("q") ?? undefined,
    pagina: Number(p.get("pagina") ?? 1) || 1, ordem, limite: Number(p.get("limite") ?? 12) || 12,
  }));
});
