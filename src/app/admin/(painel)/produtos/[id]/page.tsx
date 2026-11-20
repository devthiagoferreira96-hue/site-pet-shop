"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { enviar, useDados } from "@/components/admin/useAdminApi";
import { AreaTexto, Campo, ResumoErros } from "@/components/Campo";
import { BotaoAnimado } from "@/components/animacao/Animados";

type Cat = { id: number; nome: string; slug: string };
type Produto = { id: number; nome: string; sku: string | null; categoriaId: number | null; especie: string; marca: string | null; descricao: string;
  precoCentavos: number; estoque: number; tipoVenda: string; registroMapa: string | null; pesoVolume: string | null; imagem: string | null;
  imagemAlt: string | null; imagemFonte: string | null; ativo: boolean };
const ESPECIES = { cachorro: "Cachorro", gato: "Gato", passaro: "Pássaro", peixe: "Peixe", roedor: "Roedores", todos: "Todos os pets" };
const VENDAS = { livre: "Venda livre (online)", receita: "Exige receita — venda somente na loja física", controlado: "Controle especial (Portaria MAPA 837/2025) — não exibir" };

export default function FormProduto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const novo = id === "novo";
  const router = useRouter();
  const { dados: cats } = useDados<Cat[]>("/admin/categorias");
  const { dados: p, recarregar } = useDados<Produto>(novo ? null : `/admin/produtos/${id}`);
  const [f, setF] = useState({ nome: "", sku: "", categoriaId: "", especie: "todos", marca: "", descricao: "", preco: "", estoque: "0",
    tipoVenda: "livre", registroMapa: "", pesoVolume: "", imagemAlt: "", ativo: true });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [img, setImg] = useState<{ arquivo: File | null; alt: string; fonte: string; licencaOk: boolean }>({ arquivo: null, alt: "", fonte: "", licencaOk: false });
  const [errosImg, setErrosImg] = useState<Record<string, string>>({});

  useEffect(() => {
    if (p) setF({ nome: p.nome, sku: p.sku ?? "", categoriaId: String(p.categoriaId ?? ""), especie: p.especie, marca: p.marca ?? "", descricao: p.descricao,
      preco: (p.precoCentavos / 100).toFixed(2).replace(".", ","), estoque: String(p.estoque), tipoVenda: p.tipoVenda, registroMapa: p.registroMapa ?? "",
      pesoVolume: p.pesoVolume ?? "", imagemAlt: p.imagemAlt ?? "", ativo: p.ativo });
  }, [p]);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((a) => ({ ...a, [k]: e.target.value }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const r = await enviar<{ id: number }>(novo ? "/admin/produtos" : `/admin/produtos/${id}`, novo ? "POST" : "PUT", f);
    if (r.dados) { setErros({}); if (novo) router.replace(`/admin/produtos/${r.dados.id}`); else { setMsg("Produto salvo."); recarregar(); } }
    else setErros(r.erro?.campos ?? { _: r.erro?.mensagem ?? "Erro ao salvar." });
  }
  async function enviarImagem(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData();
    if (img.arquivo) form.set("imagem", img.arquivo);
    form.set("alt", img.alt); form.set("fonte", img.fonte); if (img.licencaOk) form.set("licencaOk", "1");
    const r = await enviar(`/admin/produtos/${id}/imagem`, "POST", undefined, form);
    if (r.dados) { setErrosImg({}); setMsg("Imagem enviada."); recarregar(); } else setErrosImg(r.erro?.campos ?? { _: r.erro?.mensagem ?? "Erro." });
  }

  if (!novo && !p) return <p className="carregando" role="status">Carregando…</p>;
  return (
    <>
      <h1>{novo ? "Novo produto" : `Editar: ${p?.nome}`}</h1>
      {msg && <p className="alerta alerta--sucesso" role="status">{msg}</p>}
      <form noValidate onSubmit={salvar} className="cartao-form glass-strong">
        <ResumoErros erros={erros} mensagem={erros._} />
        <fieldset>
          <legend>Dados do produto</legend>
          <Campo nome="nome" rotulo="Nome do produto" erros={erros} value={f.nome} onChange={set("nome")} maxLength={150} />
          <div className="grade-form">
            <Campo nome="sku" rotulo="Código (igual ao do SimplesVet)" erros={erros} obrigatorio={false} value={f.sku} onChange={set("sku")} maxLength={60}
              dica="Necessário para atualizar o estoque pela planilha do SimplesVet." />
            <Campo nome="marca" rotulo="Marca" erros={erros} obrigatorio={false} value={f.marca} onChange={set("marca")} maxLength={80} />
            <div className="campo">
              <label htmlFor="f-categoriaId">Categoria <span className="obrigatorio" aria-hidden="true">*</span></label>
              <select id="f-categoriaId" value={f.categoriaId} onChange={set("categoriaId")} aria-invalid={erros.categoriaId ? true : undefined} aria-describedby={erros.categoriaId ? "erro-categoriaId" : undefined}>
                <option value="">Selecione</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {erros.categoriaId && <p className="erro-campo" id="erro-categoriaId">{erros.categoriaId}</p>}
            </div>
            <div className="campo">
              <label htmlFor="f-especie">Indicado para</label>
              <select id="f-especie" value={f.especie} onChange={set("especie")}>{Object.entries(ESPECIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <Campo nome="preco" rotulo="Preço (R$)" erros={erros} value={f.preco} onChange={set("preco")} inputMode="decimal" maxLength={12} dica="Exemplo: 89,90" />
            <Campo nome="estoque" rotulo="Estoque" erros={erros} type="number" value={f.estoque} onChange={set("estoque")} min={0} dica="Atualizado ao importar a planilha do SimplesVet." />
            <Campo nome="pesoVolume" rotulo="Peso / volume / tamanho" erros={erros} obrigatorio={false} value={f.pesoVolume} onChange={set("pesoVolume")} maxLength={40} />
          </div>
          <AreaTexto nome="descricao" rotulo="Descrição" erros={erros} obrigatorio={false} value={f.descricao} onChange={set("descricao")} maxLength={5000}
            dica='Use as informações do fabricante. Não prometa resultados ("cura", "elimina 100%") sem comprovação.' />
        </fieldset>
        <fieldset>
          <legend>Medicamentos e regras de venda</legend>
          <div className="campo">
            <label htmlFor="f-tipoVenda">Tipo de venda</label>
            <select id="f-tipoVenda" value={f.tipoVenda} onChange={set("tipoVenda")} aria-describedby="dica-tipo">{Object.entries(VENDAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <p className="dica" id="dica-tipo">Confira na embalagem/bula: “venda sob prescrição” = exige receita. Controle especial nunca aparece no site/app. Na dúvida, consulte o veterinário responsável técnico.</p>
          </div>
          <Campo nome="registroMapa" rotulo="Nº de registro/licença no MAPA" erros={erros} obrigatorio={false} value={f.registroMapa} onChange={set("registroMapa")} maxLength={60}
            dica='Obrigatório para Medicações. Está no rótulo: "Licenciado no MAPA sob nº…".' />
        </fieldset>
        {!novo && <Campo nome="imagemAlt" rotulo="Texto alternativo da imagem atual" erros={erros} obrigatorio={false} value={f.imagemAlt} onChange={set("imagemAlt")} maxLength={200} />}
        <div className="campo campo--check">
          <input type="checkbox" id="f-ativo" checked={f.ativo} onChange={(e) => setF((a) => ({ ...a, ativo: e.target.checked }))} />
          <label htmlFor="f-ativo">Visível no site e no app (exceto controle especial, que nunca aparece)</label>
        </div>
        <div className="acoes-linha">
          <button type="submit" className="botao botao--hero">Salvar produto</button>
          <Link className="botao botao--glass" href="/admin/produtos">Voltar</Link>
        </div>
      </form>

      {!novo && (
        <form noValidate onSubmit={enviarImagem} className="cartao-form glass-strong">
          <h2>Imagem</h2>
          {p?.imagem && <img src={`/api/v1/imagens/${p.imagem}`} alt={`Imagem atual: ${p.imagemAlt ?? "sem descrição"}`} width={160} height={160} />}
          {p?.imagemFonte && <p className="nota">Origem registrada: {p.imagemFonte}</p>}
          <ResumoErros erros={errosImg} mensagem={errosImg._} />
          <div className="campo">
            <label htmlFor="f-imagem">Nova imagem (JPG, PNG ou WEBP, até 3 MB)</label>
            <input id="f-imagem" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImg((a) => ({ ...a, arquivo: e.target.files?.[0] ?? null }))}
              aria-invalid={errosImg.imagem ? true : undefined} aria-describedby={errosImg.imagem ? "erro-imagem" : undefined} />
            {errosImg.imagem && <p className="erro-campo" id="erro-imagem">{errosImg.imagem}</p>}
          </div>
          <Campo nome="alt" rotulo="Texto alternativo" erros={errosImg} value={img.alt} onChange={(e) => setImg((a) => ({ ...a, alt: e.target.value }))} maxLength={200}
            dica='Descreva o que aparece, ex.: "Pacote azul de ração seca para cães adultos, 15 kg".' />
          <Campo nome="fonte" rotulo="Origem / licença da imagem" erros={errosImg} value={img.fonte} onChange={(e) => setImg((a) => ({ ...a, fonte: e.target.value }))} maxLength={200}
            dica='Ex.: "Foto tirada pela loja" ou "Material do fabricante — autorização por e-mail em 10/11/2026". Nunca copie imagens de outros sites.' />
          <div className="campo campo--check">
            <input type="checkbox" id="f-licencaOk" checked={img.licencaOk} onChange={(e) => setImg((a) => ({ ...a, licencaOk: e.target.checked }))}
              aria-invalid={errosImg.licencaOk ? true : undefined} aria-describedby={errosImg.licencaOk ? "erro-licencaOk" : undefined} />
            <label htmlFor="f-licencaOk">Confirmo que a empresa tem direito de usar esta imagem (foto própria ou autorização por escrito).</label>
          </div>
          {errosImg.licencaOk && <p className="erro-campo" id="erro-licencaOk">{errosImg.licencaOk}</p>}
          <BotaoAnimado type="submit" className="botao botao--hero" icone="enviar">Enviar imagem</BotaoAnimado>
        </form>
      )}
    </>
  );
}
