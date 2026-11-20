import { ok, rota } from "@/server/http";
import { listarCategorias } from "@/server/services/produtos";

export const GET = rota(async () => ok(await listarCategorias()));
