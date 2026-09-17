-- Livro-razão (fluxo de caixa): entradas/saídas por empresa, com vínculo opcional à NFS-e paga.

CREATE TABLE "cash_flow_entries" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "nfseId" INTEGER,
    "bankPaymentRequestCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cash_flow_entries_nfseId_key" ON "cash_flow_entries"("nfseId");

CREATE INDEX "cash_flow_entries_companyId_occurredAt_idx" ON "cash_flow_entries"("companyId", "occurredAt");

ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_nfseId_fkey" FOREIGN KEY ("nfseId") REFERENCES "nfses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
