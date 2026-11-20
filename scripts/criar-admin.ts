/**
 * Cria um administrador. NÃO existe cadastro público de admin no site (no Lovable, a primeira conta
 * criada virava admin automaticamente — qualquer pessoa poderia tomar o painel).
 * Uso: npm run criar-admin
 */
import { createInterface } from "node:readline";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { emailSchema, SENHA_MIN } from "@/domain/validacao";
import { hashSenha } from "@/domain/seguranca";

function perguntar(texto: string, oculto = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      out._writeToOutput = (s: string) => { if (s.includes(texto)) out.output.write(s); }; // não mostra a senha
    }
    rl.question(texto, (r) => { rl.close(); if (oculto) process.stdout.write("\n"); resolve(r); });
  });
}

const email = emailSchema.parse(await perguntar("E-mail do administrador: "));
const nome = (await perguntar("Nome: ")).trim() || "Administrador";
const senha = await perguntar(`Senha (mín. ${SENHA_MIN} caracteres): `, true);
if (senha.length < SENHA_MIN) { console.error(`A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`); process.exit(1); }
if (senha !== (await perguntar("Confirme a senha: ", true))) { console.error("As senhas não conferem."); process.exit(1); }
await db.insert(admins).values({ email, nome, senhaHash: await hashSenha(senha) });
console.log(`Administrador ${email} criado.`);
process.exit(0);
