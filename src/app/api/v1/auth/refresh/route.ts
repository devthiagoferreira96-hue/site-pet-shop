import { z } from "zod";
import { erro, lerJson, ok, rota } from "@/server/http";
import { renovarTokensApp } from "@/server/services/auth";

/** Troca o refresh token por um par novo. O refresh antigo deixa de valer (rotação). */
export const POST = rota(async (req) => {
  const { refreshToken } = await lerJson(req, z.object({ refreshToken: z.string().min(1).max(200) }));
  const novos = await renovarTokensApp(refreshToken);
  return novos ? ok(novos) : erro(401, "Sessão expirada. Faça login novamente.");
});
