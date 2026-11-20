DROP INDEX "idx_ped_email";--> statement-breakpoint
ALTER TABLE "contatos" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pedidos" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pedidos" ALTER COLUMN "telefone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pedidos" ALTER COLUMN "cpf" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pedidos" ALTER COLUMN "endereco" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contatos" ADD COLUMN "email_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "email_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "email_hash" varchar(64);--> statement-breakpoint
CREATE INDEX "idx_contato_email_hash" ON "contatos" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "idx_ped_email_hash" ON "pedidos" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "idx_sol_email_hash" ON "solicitacoes" USING btree ("email_hash");