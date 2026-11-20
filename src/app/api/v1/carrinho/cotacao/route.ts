import { lerJson, ok, rota } from "@/server/http";
import { cotacaoSchema } from "@/domain/validacao";
import { cotar } from "@/server/services/pedidos";

/** O carrinho fica no dispositivo (só ids e quantidades). Preços e disponibilidade sempre vêm daqui. */
export const POST = rota(async (req) => {
  const d = await lerJson(req, cotacaoSchema);
  return ok(await cotar(d.itens, d.modalidade));
});
