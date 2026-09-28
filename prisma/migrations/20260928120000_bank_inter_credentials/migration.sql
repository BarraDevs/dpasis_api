-- Credenciais Inter (API keys + certificado) no cadastro de bancos.
-- Segredos ficam cifrados; o arquivo do certificado vai para disco, não para esta tabela.
ALTER TABLE "banks" ADD COLUMN "apiUrl" VARCHAR(512);
ALTER TABLE "banks" ADD COLUMN "clientIdCiphertext" TEXT;
ALTER TABLE "banks" ADD COLUMN "clientIdHint" VARCHAR(4);
ALTER TABLE "banks" ADD COLUMN "clientSecretCiphertext" TEXT;
ALTER TABLE "banks" ADD COLUMN "webhookTokenHash" VARCHAR(64);
ALTER TABLE "banks" ADD COLUMN "certFormat" TEXT;
ALTER TABLE "banks" ADD COLUMN "certFilePath" TEXT;
ALTER TABLE "banks" ADD COLUMN "keyFilePath" TEXT;
ALTER TABLE "banks" ADD COLUMN "certPasswordCiphertext" TEXT;
ALTER TABLE "banks" ADD COLUMN "certificateNotAfter" TIMESTAMP(3);

CREATE UNIQUE INDEX "banks_webhookTokenHash_key" ON "banks"("webhookTokenHash");
