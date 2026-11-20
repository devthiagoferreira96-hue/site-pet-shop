CREATE TYPE "public"."status_pedido" AS ENUM('aguardando_pagamento', 'pago', 'separando', 'pronto_retirada', 'enviado', 'entregue', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_credencial" AS ENUM('web', 'access', 'refresh');--> statement-breakpoint
CREATE TYPE "public"."tipo_venda" AS ENUM('livre', 'receita', 'controlado');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"nome" varchar(120) NOT NULL,
	"senha_hash" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_login" timestamp with time zone,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auditoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"acao" varchar(60) NOT NULL,
	"detalhe" varchar(500),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(60) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"emoji" varchar(8) DEFAULT '🐾' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categorias_nome_unique" UNIQUE("nome"),
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contatos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"assunto" varchar(150) NOT NULL,
	"mensagem" text NOT NULL,
	"respondido" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credenciais" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tipo" "tipo_credencial" NOT NULL,
	"admin_id" integer NOT NULL,
	"familia" varchar(64),
	"expira_em" timestamp with time zone NOT NULL,
	"usado_em" timestamp with time zone,
	"revogado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedido_itens" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"produto_id" integer,
	"nome_produto" varchar(150) NOT NULL,
	"sku" varchar(60),
	"preco_unit_centavos" integer NOT NULL,
	"quantidade" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"status" "status_pedido" DEFAULT 'aguardando_pagamento' NOT NULL,
	"canal" varchar(10) DEFAULT 'site' NOT NULL,
	"nome" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"telefone" varchar(13) NOT NULL,
	"cpf" varchar(11),
	"modalidade" varchar(10) NOT NULL,
	"endereco" varchar(300),
	"subtotal_centavos" integer NOT NULL,
	"frete_centavos" integer DEFAULT 0 NOT NULL,
	"total_centavos" integer NOT NULL,
	"aceite_termos_versao" varchar(20) NOT NULL,
	"aceite_em" timestamp with time zone NOT NULL,
	"marketing_optin" boolean DEFAULT false NOT NULL,
	"marketing_optin_em" timestamp with time zone,
	"anonimizado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(60),
	"nome" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"categoria_id" integer,
	"especie" varchar(20) DEFAULT 'todos' NOT NULL,
	"marca" varchar(80),
	"descricao" text DEFAULT '' NOT NULL,
	"preco_centavos" integer NOT NULL,
	"estoque" integer DEFAULT 0 NOT NULL,
	"tipo_venda" "tipo_venda" DEFAULT 'livre' NOT NULL,
	"registro_mapa" varchar(60),
	"peso_volume" varchar(40),
	"imagem" varchar(80),
	"imagem_alt" varchar(200),
	"imagem_fonte" varchar(200),
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_sku_unique" UNIQUE("sku"),
	CONSTRAINT "produtos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "solicitacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"protocolo" varchar(20) NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"nome" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"codigo_pedido" varchar(20),
	"detalhes" text,
	"status" varchar(20) DEFAULT 'aberta' NOT NULL,
	"resposta" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"concluido_em" timestamp with time zone,
	CONSTRAINT "solicitacoes_protocolo_unique" UNIQUE("protocolo")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"origem" varchar(120) NOT NULL,
	"atualizados" integer DEFAULT 0 NOT NULL,
	"nao_encontrados" integer DEFAULT 0 NOT NULL,
	"erros" text,
	"admin_id" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credenciais" ADD CONSTRAINT "credenciais_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cred_admin" ON "credenciais" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_cred_familia" ON "credenciais" USING btree ("familia");--> statement-breakpoint
CREATE INDEX "idx_ped_email" ON "pedidos" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_ped_status" ON "pedidos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prod_cat" ON "produtos" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "idx_prod_pub" ON "produtos" USING btree ("ativo","tipo_venda");