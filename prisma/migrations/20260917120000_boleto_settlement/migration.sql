-- Acompanhamento de pagamento/cancelamento/expiração do boleto (webhook Bolepix + varredura).

ALTER TABLE "nfses" ADD COLUMN "bankPaymentSettledAt" TIMESTAMP(3);
ALTER TABLE "nfses" ADD COLUMN "bankPaymentNextSettlementAt" TIMESTAMP(3);

CREATE INDEX "nfses_bankPaymentNextSettlementAt_idx" ON "nfses"("bankPaymentNextSettlementAt");
