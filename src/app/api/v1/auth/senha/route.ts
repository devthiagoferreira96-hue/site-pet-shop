import { erro, exigirAdmin, lerJson, ok, rota } from "@/server/http";
import { novaSenhaSchema } from "@/domain/validacao";
import { trocarSenha } from "@/server/services/auth";

export const POST = rota(async (req) => {
  const admin = await exigirAdmin(req);
  const d = await lerJson(req, novaSenhaSchema);
  const r = await trocarSenha(admin, d.atual, d.nova);
  if (!r.ok) return erro(422, r.erro, { atual: r.erro });
  return ok({ mensagem: `Senha alterada. ${r.encerradas} sessão(ões) em outros dispositivos foram encerradas.` });
});
