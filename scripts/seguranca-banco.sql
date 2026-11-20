-- =====================================================================================
-- Segurança do banco (rode DEPOIS de npm run db:migrate):  npm run db:seguranca
-- Pode rodar quantas vezes quiser (é idempotente). Precisa ser executado pelo DONO do banco.
--
-- O que faz:
--  1. Papéis separados (princípio do menor privilégio):
--       ma_app        -> usado pelo SITE. Não cria/apaga tabelas, não apaga pedidos nem logs.
--       ma_manutencao -> usado só pelos scripts de retenção (limpar-dados) e criar-admin.
--       dono do banco -> só migrações e seed. Nunca use o dono no site em produção.
--  2. RLS (segurança em nível de linha) ligada em TODAS as tabelas, com políticas por papel.
--     Qualquer outro papel (ex.: "anon"/"authenticated" do Supabase, PUBLIC) não enxerga nenhuma linha.
--  3. Logs (auditoria) travados: só INSERT e SELECT; ninguém altera; só a manutenção apaga
--     registros com mais de 2 anos (política de retenção).
--  4. Bloqueio de adulteração: valores, itens e aceite dos Termos de um pedido não podem ser alterados
--     depois de gravados; credenciais só podem ser marcadas como usadas/revogadas; preços/estoques
--     negativos são recusados pelo próprio banco.
-- =====================================================================================

-- ---------------------------------------------------------------- 1. permissões
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
DO $$ BEGIN
  -- Supabase expõe o schema public pela Data API com estes papéis: tiramos todo acesso deles.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ma_app, ma_manutencao;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ma_app, ma_manutencao;

-- site (ma_app): só o que as telas e a API usam. Nada de DELETE em pedidos, produtos, logs.
GRANT SELECT, UPDATE                 ON admins        TO ma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON credenciais   TO ma_app;
GRANT SELECT                         ON categorias    TO ma_app;
GRANT SELECT, INSERT, UPDATE         ON produtos      TO ma_app;
GRANT SELECT, INSERT, UPDATE         ON pedidos       TO ma_app;
GRANT SELECT, INSERT                 ON pedido_itens  TO ma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON contatos      TO ma_app;   -- DELETE: pedido de eliminação (LGPD)
GRANT SELECT, INSERT, UPDATE         ON solicitacoes  TO ma_app;
GRANT SELECT, INSERT                 ON sync_logs     TO ma_app;
GRANT SELECT, INSERT                 ON auditoria     TO ma_app;   -- logs: só grava e lê

-- manutenção (scripts): retenção LGPD e criação de admin.
GRANT SELECT, INSERT                 ON admins        TO ma_manutencao;
GRANT SELECT, DELETE                 ON credenciais   TO ma_manutencao;
GRANT SELECT, UPDATE                 ON pedidos       TO ma_manutencao;
GRANT SELECT, DELETE                 ON contatos      TO ma_manutencao;
GRANT SELECT, DELETE                 ON solicitacoes  TO ma_manutencao;
GRANT SELECT, DELETE                 ON auditoria     TO ma_manutencao;
GRANT SELECT                         ON pedido_itens, produtos, categorias, sync_logs TO ma_manutencao;

-- ---------------------------------------------------------------- 2. RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admins','credenciais','categorias','produtos','pedidos','pedido_itens',
                           'contatos','solicitacoes','sync_logs','auditoria'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- políticas são recriadas a cada execução (idempotente)
    EXECUTE format('DROP POLICY IF EXISTS app_acesso ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS manutencao_acesso ON %I', t);
  END LOOP;
END $$;

-- O site enxerga as tabelas que usa (as permissões acima definem O QUE pode fazer).
CREATE POLICY app_acesso ON admins       FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON credenciais  FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON categorias   FOR SELECT TO ma_app USING (true);
CREATE POLICY app_acesso ON produtos     FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON pedidos      FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON pedido_itens FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON contatos     FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON solicitacoes FOR ALL TO ma_app USING (true) WITH CHECK (true);
CREATE POLICY app_acesso ON sync_logs    FOR ALL TO ma_app USING (true) WITH CHECK (true);
-- logs: o site só grava e lê (sem política de UPDATE/DELETE = proibido)
DROP POLICY IF EXISTS app_ler ON auditoria;
DROP POLICY IF EXISTS app_gravar ON auditoria;
CREATE POLICY app_ler    ON auditoria FOR SELECT TO ma_app USING (true);
CREATE POLICY app_gravar ON auditoria FOR INSERT TO ma_app WITH CHECK (true);

-- manutenção
CREATE POLICY manutencao_acesso ON admins       FOR ALL TO ma_manutencao USING (true) WITH CHECK (true);
CREATE POLICY manutencao_acesso ON credenciais  FOR ALL TO ma_manutencao USING (true);
CREATE POLICY manutencao_acesso ON pedidos      FOR ALL TO ma_manutencao USING (true) WITH CHECK (true);
CREATE POLICY manutencao_acesso ON pedido_itens FOR SELECT TO ma_manutencao USING (true);
CREATE POLICY manutencao_acesso ON produtos     FOR SELECT TO ma_manutencao USING (true);
CREATE POLICY manutencao_acesso ON categorias   FOR SELECT TO ma_manutencao USING (true);
CREATE POLICY manutencao_acesso ON sync_logs    FOR SELECT TO ma_manutencao USING (true);
CREATE POLICY manutencao_acesso ON contatos     FOR ALL TO ma_manutencao USING (true);
CREATE POLICY manutencao_acesso ON solicitacoes FOR ALL TO ma_manutencao USING (true);
-- logs: a manutenção só consegue apagar o que já passou do prazo de retenção (2 anos)
DROP POLICY IF EXISTS manutencao_ler ON auditoria;
DROP POLICY IF EXISTS manutencao_apagar_antigos ON auditoria;
CREATE POLICY manutencao_ler            ON auditoria FOR SELECT TO ma_manutencao USING (true);
CREATE POLICY manutencao_apagar_antigos ON auditoria FOR DELETE TO ma_manutencao USING (criado_em < now() - interval '2 years');

-- ---------------------------------------------------------------- 3. logs imutáveis (vale até para o dono)
CREATE OR REPLACE FUNCTION ma_bloquear_alteracao_log() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Registros de auditoria não podem ser alterados.';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.criado_em >= now() - interval '2 years' THEN
    RAISE EXCEPTION 'Registros de auditoria só podem ser apagados após o prazo de retenção (2 anos).';
  END IF;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS ma_auditoria_imutavel ON auditoria;
CREATE TRIGGER ma_auditoria_imutavel BEFORE UPDATE OR DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION ma_bloquear_alteracao_log();

-- ---------------------------------------------------------------- 4. bloqueio de adulteração
-- Pedido: depois de gravado, só mudam o STATUS e (na anonimização LGPD) os dados pessoais.
CREATE OR REPLACE FUNCTION ma_proteger_pedido() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS DISTINCT FROM OLD.codigo
     OR NEW.subtotal_centavos IS DISTINCT FROM OLD.subtotal_centavos
     OR NEW.frete_centavos IS DISTINCT FROM OLD.frete_centavos
     OR NEW.total_centavos IS DISTINCT FROM OLD.total_centavos
     OR NEW.modalidade IS DISTINCT FROM OLD.modalidade
     OR NEW.canal IS DISTINCT FROM OLD.canal
     OR NEW.aceite_termos_versao IS DISTINCT FROM OLD.aceite_termos_versao
     OR NEW.aceite_em IS DISTINCT FROM OLD.aceite_em
     OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
    RAISE EXCEPTION 'Valores, itens e aceite dos Termos de um pedido não podem ser alterados.';
  END IF;
  IF (NEW.nome, NEW.email, NEW.telefone, NEW.cpf, NEW.endereco) IS DISTINCT FROM
     (OLD.nome, OLD.email, OLD.telefone, OLD.cpf, OLD.endereco)
     AND NOT NEW.anonimizado THEN
    RAISE EXCEPTION 'Dados do cliente só podem mudar na anonimização (LGPD).';
  END IF;
  IF OLD.anonimizado AND NOT NEW.anonimizado THEN
    RAISE EXCEPTION 'Um pedido anonimizado não pode voltar a ter dados pessoais.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ma_pedido_protegido ON pedidos;
CREATE TRIGGER ma_pedido_protegido BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION ma_proteger_pedido();

-- Itens do pedido: imutáveis (só o vínculo com o produto pode virar NULL se o produto for apagado).
CREATE OR REPLACE FUNCTION ma_proteger_item() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- só some junto com o pedido (ON DELETE CASCADE), nunca sozinho
    IF EXISTS (SELECT 1 FROM pedidos WHERE id = OLD.pedido_id) THEN
      RAISE EXCEPTION 'Itens de pedido não podem ser apagados.';
    END IF;
    RETURN OLD;
  END IF;
  IF (NEW.pedido_id, NEW.nome_produto, NEW.sku, NEW.preco_unit_centavos, NEW.quantidade) IS DISTINCT FROM
     (OLD.pedido_id, OLD.nome_produto, OLD.sku, OLD.preco_unit_centavos, OLD.quantidade)
     OR (NEW.produto_id IS DISTINCT FROM OLD.produto_id AND NEW.produto_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Itens de pedido não podem ser alterados.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ma_item_protegido ON pedido_itens;
CREATE TRIGGER ma_item_protegido BEFORE UPDATE OR DELETE ON pedido_itens FOR EACH ROW EXECUTE FUNCTION ma_proteger_item();

-- Credenciais: só podem ser marcadas como usadas/revogadas (nada de "renovar" um token por fora).
CREATE OR REPLACE FUNCTION ma_proteger_credencial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.id, NEW.tipo, NEW.admin_id, NEW.familia, NEW.expira_em, NEW.criado_em) IS DISTINCT FROM
     (OLD.id, OLD.tipo, OLD.admin_id, OLD.familia, OLD.expira_em, OLD.criado_em) THEN
    RAISE EXCEPTION 'Credenciais só podem ser marcadas como usadas ou revogadas.';
  END IF;
  IF OLD.revogado_em IS NOT NULL AND NEW.revogado_em IS NULL THEN
    RAISE EXCEPTION 'Uma credencial revogada não pode ser reativada.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ma_credencial_protegida ON credenciais;
CREATE TRIGGER ma_credencial_protegida BEFORE UPDATE ON credenciais FOR EACH ROW EXECUTE FUNCTION ma_proteger_credencial();

-- Regras que o banco garante sozinho
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_preco_nao_negativo') THEN
    ALTER TABLE produtos ADD CONSTRAINT produtos_preco_nao_negativo CHECK (preco_centavos >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_estoque_nao_negativo') THEN
    ALTER TABLE produtos ADD CONSTRAINT produtos_estoque_nao_negativo CHECK (estoque >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedido_itens_qtd_valida') THEN
    ALTER TABLE pedido_itens ADD CONSTRAINT pedido_itens_qtd_valida CHECK (quantidade BETWEEN 1 AND 20 AND preco_unit_centavos >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_total_coerente') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_total_coerente CHECK (total_centavos = subtotal_centavos + frete_centavos AND subtotal_centavos >= 0 AND frete_centavos >= 0);
  END IF;
END $$;
