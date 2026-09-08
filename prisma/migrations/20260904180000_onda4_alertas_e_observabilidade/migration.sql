-- Onda 4: ressalvas do fisco que acompanham a nota emitida.
--
-- Códigos `A*` chegam em `ListaMensagemAlertaRetorno`, no mesmo ramo de sucesso da consulta do lote,
-- e até aqui nem eram extraídos do XML. Significam "a NFS-e foi emitida, com uma pendência" — o tipo
-- de erro que não quebra nada hoje e cobra caro depois.
ALTER TABLE "nfses" ADD COLUMN "providerAlerts" TEXT;
ALTER TABLE "nfses" ADD COLUMN "providerAlertedAt" TIMESTAMP(3);
