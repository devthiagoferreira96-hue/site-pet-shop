import { ErroHttp, lerJson, limitarPublico, ok, rota, verificarHumano } from "@/server/http";
import { pedidoSchema } from "@/domain/validacao";
import { criarPedido, ErroEstoque, ErroPedido } from "@/server/services/pedidos";
import { ENTREGA } from "@/config/empresa";

/** Cria pedido de visitante (site ou app). Envie o header "X-Cliente: app" a partir do app. */
export const POST = rota(async (req) => {
  limitarPublico(req, "pedido");
  const d = await lerJson(req, pedidoSchema);
  await verificarHumano(req, d);
  if (d.modalidade === "entrega" && !ENTREGA.ativa) throw new ErroHttp(422, "Entrega indisponível.", { modalidade: "No momento só há retirada na loja." });
  try {
    return ok(await criarPedido(d, req.headers.get("x-cliente") === "app" ? "app" : "site"), 201);
  } catch (e) {
    if (e instanceof ErroEstoque || e instanceof ErroPedido) throw new ErroHttp(409, e.message);
    throw e;
  }
});
