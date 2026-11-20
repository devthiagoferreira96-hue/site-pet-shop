/**
 * Baixa os ícones animados oficiais do lucide-animated (https://lucide-animated.com, licença MIT)
 * para src/components/icons/, usando o CLI do shadcn — o método oficial da biblioteca.
 * Uso: npm run icones   (rode de novo se adicionar ícones em src/components/animacao/icones-lista.json)
 *
 * IMPORTANTE — ajuste automático depois do download:
 * os ícones vêm com um <div> por fora. Ícone é conteúdo "inline": aparece dentro de <p>, <button>, <a>, <h2>...
 * e <div> dentro de <p> é HTML inválido. O navegador "corrige" a página, ela fica diferente da que o servidor
 * gerou e o Next mostra "In HTML, <div> cannot be a descendant of <p>" + "Hydration failed".
 * Por isso este script troca o <div> externo por <span> (e o tipo HTMLDivElement por HTMLSpanElement).
 * Como o CLI usa --overwrite, sem este ajuste o erro voltaria toda vez que os ícones fossem baixados de novo.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const icones = JSON.parse(readFileSync(new URL("../src/components/animacao/icones-lista.json", import.meta.url), "utf8"));
const arquivo = (n) => new URL(`../src/components/icons/${n}.tsx`, import.meta.url);

/** Troca o invólucro <div> por <span>. Não mexe em nada dentro do <motion.svg>. Pode rodar várias vezes. */
function trocarDivPorSpan(codigo) {
  return codigo
    .replace(/HTMLDivElement/g, "HTMLSpanElement")
    .replace(/<div(\s|>)/g, "<span$1")
    .replace(/<\/div>/g, "</span>");
}

const soAjustar = process.argv.includes("--so-ajustar"); // ajusta os arquivos já baixados, sem baixar de novo

if (!soAjustar) {
  const urls = icones.map((n) => `https://lucide-animated.com/r/${n}.json`);
  console.log(`Instalando ${icones.length} ícones do lucide-animated...`);
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(npx, ["--yes", "shadcn@latest", "add", ...urls, "--yes", "--overwrite", "--path", "src/components/icons"],
    { stdio: "inherit", shell: process.platform === "win32" });
}

const faltando = icones.filter((n) => !existsSync(arquivo(n)));
if (faltando.length) {
  console.error(`\nNão encontrei estes arquivos em src/components/icons: ${faltando.join(", ")}.`);
  console.error("Confira se o nome existe em https://lucide-animated.com e ajuste src/components/animacao/icones-lista.json.");
  process.exit(1);
}

let ajustados = 0;
for (const n of icones) {
  const antes = readFileSync(arquivo(n), "utf8");
  const depois = trocarDivPorSpan(antes);
  if (depois !== antes) { writeFileSync(arquivo(n), depois); ajustados++; }
  if (/<div[\s>]/.test(depois)) { console.error(`Ainda há <div> em ${n}.tsx — confira o arquivo.`); process.exit(1); }
}
console.log(`\nÍcones prontos (${ajustados} ajustado(s) de <div> para <span>).`);
console.log("Licença: MIT — https://github.com/pqoqubbw/icons/blob/main/LICENSE");
