-- Onda 3 — recuperação automática (docs/auditoria-nfm-resiliencia.md §8)

-- 1. Agendamento da reconciliação por nota. Sem estas colunas a varredura não tem como espaçar as
--    consultas ao provedor: ou consulta tudo a cada volta, ou nunca reconsulta.
ALTER TABLE "nfses" ADD COLUMN "reconcileAttemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "nfses" ADD COLUMN "nextReconcileAt" TIMESTAMP(3);

-- 2. Confirmação da cobrança (P1-08). `POST /cobrancas` do Inter é assíncrono: receber
--    `codigoSolicitacao` não significa que o boleto foi produzido.
ALTER TABLE "nfses" ADD COLUMN "bankPaymentStatus" TEXT;
ALTER TABLE "nfses" ADD COLUMN "bankPaymentConfirmedAt" TIMESTAMP(3);

-- 3. Notas já paradas entram na primeira varredura.
UPDATE "nfses" SET "nextReconcileAt" = CURRENT_TIMESTAMP
WHERE "status" NOT IN ('ISSUED', 'CANCELED', 'FAILED', 'REJECTED');

-- 4. Cobranças antigas não reabrem: o que já estava vinculado conta como confirmado. Sem este
--    backfill a varredura de confirmação começaria consultando o Inter por todo o histórico.
UPDATE "nfses" SET "bankPaymentConfirmedAt" = COALESCE("issuedAt", "updatedAt")
WHERE "bankPaymentRequestCode" IS NOT NULL;

-- 5. Índices das duas varreduras novas.
CREATE INDEX "nfses_status_nextReconcileAt_idx" ON "nfses"("status", "nextReconcileAt");
CREATE INDEX "nfses_bankPaymentRequestCode_idx" ON "nfses"("bankPaymentRequestCode");
