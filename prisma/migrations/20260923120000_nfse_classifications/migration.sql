-- Classificação interna NFM/NFS por empresa + série + número do RPS. Sem FK: a nota pode
-- existir só no Giss. Sem envio ao provedor.

CREATE TABLE "nfse_classifications" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "rpsNumber" INTEGER NOT NULL,
    "rpsSeries" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfse_classifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nfse_classifications_companyId_rpsSeries_rpsNumber_key" ON "nfse_classifications"("companyId", "rpsSeries", "rpsNumber");
