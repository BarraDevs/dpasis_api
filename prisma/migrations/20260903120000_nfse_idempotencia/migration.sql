-- Onda 2 — impedir a duplicidade (docs/auditoria-nfm-resiliencia.md §8)

-- 1. Vínculo explícito NFS-e -> NFM e guardas locais de idempotência do boleto.
ALTER TABLE "nfses" ADD COLUMN "nfmId" INTEGER;
ALTER TABLE "nfses" ADD COLUMN "bankPaymentIdempotencyKey" TEXT;
ALTER TABLE "nfses" ADD COLUMN "bankPaymentRequestedAt" TIMESTAMP(3);
ALTER TABLE "nfses" ADD COLUMN "bankPaymentErrorMessage" TEXT;
ALTER TABLE "nfses" ADD COLUMN "bankPaymentFailedAt" TIMESTAMP(3);

-- 2. Backfill do vínculo a partir do lado que já existe (nfms."nfseId").
UPDATE "nfses" f SET "nfmId" = n."id" FROM "nfms" n WHERE n."nfseId" = f."id";

-- 3. Backfill da intenção de boleto: uma NFS-e que já tem cobrança vinculada teve a chamada feita.
UPDATE "nfses"
SET "bankPaymentIdempotencyKey" = 'nfse-' || "id",
    "bankPaymentRequestedAt"    = COALESCE("issuedAt", "updatedAt")
WHERE "bankPaymentRequestCode" IS NOT NULL;

-- 4. Índices.
CREATE UNIQUE INDEX "nfses_bankPaymentIdempotencyKey_key" ON "nfses"("bankPaymentIdempotencyKey");
CREATE INDEX "nfses_status_updatedAt_idx" ON "nfses"("status", "updatedAt");
CREATE INDEX "nfses_nfmId_idx" ON "nfses"("nfmId");

-- 5. A garantia de banco contra P0-01/P1-05: no máximo uma NFS-e viva por NFM.
--    Índice parcial não é expressável no schema Prisma, por isso vive só aqui.
--    'REJECTED' ainda não existe no enum de aplicação (chega na Onda 3); listar desde já evita
--    ter que recriar o índice quando chegar.
CREATE UNIQUE INDEX "nfses_one_active_per_nfm"
  ON "nfses" ("nfmId")
  WHERE "status" NOT IN ('FAILED', 'REJECTED');

-- 6. Trilha de tentativas contra provedor (P2-03).
CREATE TABLE "nfse_attempts" (
    "id" SERIAL NOT NULL,
    "nfseId" INTEGER NOT NULL,
    "operation" TEXT NOT NULL,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "httpStatus" INTEGER,
    "errorClass" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfse_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "nfse_attempts_nfseId_createdAt_idx" ON "nfse_attempts"("nfseId", "createdAt");

-- 7. Outbox do despacho de jobs (P0-01/P1-02).
CREATE TABLE "nfse_outbox" (
    "id" SERIAL NOT NULL,
    "nfseId" INTEGER NOT NULL,
    "jobName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfse_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "nfse_outbox_dispatchedAt_availableAt_idx" ON "nfse_outbox"("dispatchedAt", "availableAt");
