-- Retentativa automática do boleto (docs/auditoria-nfm-resiliencia.md §7.2)

-- 1. Agendamento da retentativa por nota. Sem estas colunas, uma falha transitória do Inter virava
--    `bankPaymentFailedAt` e a varredura de boleto faltante nunca mais olhava a nota.
ALTER TABLE "nfses" ADD COLUMN "bankPaymentRetryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "nfses" ADD COLUMN "bankPaymentNextRetryAt" TIMESTAMP(3);

-- 2. Sem backfill: as notas que já falharam não dizem se a falha foi transitória ou permanente, e
--    reabri-las às cegas é decisão da operação. Continuam no retry manual
--    (`POST /admin/bank-payment/nfm/:id`).

-- 3. Índice da varredura de retentativa.
CREATE INDEX "nfses_status_bankPaymentNextRetryAt_idx" ON "nfses"("status", "bankPaymentNextRetryAt");
