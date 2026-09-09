-- Multa e mora percentuais no cadastro de bancos (emissão de boleto / Inter Bolepix).
ALTER TABLE "banks" ADD COLUMN "fineRate" DECIMAL(5,2);
ALTER TABLE "banks" ADD COLUMN "moraRate" DECIMAL(5,2);
