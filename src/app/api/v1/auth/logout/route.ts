import { NextResponse } from "next/server";
import { apagarCookieSessao, exigirAdmin, rota } from "@/server/http";
import { sair } from "@/server/services/auth";

/** Revoga a sessão (site) ou a família de tokens (app) no servidor: cópias roubadas deixam de valer. */
export const POST = rota(async (req) => {
  await sair(await exigirAdmin(req));
  const res = NextResponse.json({ dados: { ok: true } });
  apagarCookieSessao(res);
  return res;
});
