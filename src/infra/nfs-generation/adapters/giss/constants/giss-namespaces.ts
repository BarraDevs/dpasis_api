/**
 * Namespaces reais confirmados a partir dos XSDs oficiais do Giss (`gissonline_docs/Schemas_XSD-Servicos_Prestados.rar`)
 * e de teste ao vivo contra `ws-maua.giss.com.br` (produção). O manual "Guia Rápido" sugere o namespace ABRASF
 * genérico (`http://www.abrasf.org.br/nfse.xsd`) para tudo, mas o Giss usa um namespace próprio por tipo de
 * mensagem — só os tipos simples/complexos compartilhados (Prestador, Servico, Valores, RPS, etc.) ficam sob
 * `tipos-v2_04.xsd`; cada elemento raiz de operação (EnviarLoteRpsEnvio, ConsultarLoteRpsEnvio, cabecalho) tem
 * o seu próprio namespace `-v2_04.xsd`.
 */
export const GISS_TIPOS_NAMESPACE = 'http://www.giss.com.br/tipos-v2_04.xsd';
export const GISS_ENVIAR_LOTE_RPS_ENVIO_NAMESPACE = 'http://www.giss.com.br/enviar-lote-rps-envio-v2_04.xsd';
export const GISS_CONSULTAR_LOTE_RPS_ENVIO_NAMESPACE = 'http://www.giss.com.br/consultar-lote-rps-envio-v2_04.xsd';
export const GISS_CONSULTAR_NFSE_SERVICO_PRESTADO_ENVIO_NAMESPACE = 'http://www.giss.com.br/consultar-nfse-servico-prestado-envio-v2_04.xsd';
export const GISS_CABECALHO_NAMESPACE = 'http://www.giss.com.br/cabecalho-v2_04.xsd';

/**
 * NÃO CONFIRMADO no XSD oficial: `Schemas_XSD-Servicos_Prestados.rar` não pôde ser extraído (sem `unrar`/`7z`
 * disponível) pra confirmar o namespace real do elemento raiz `CancelarNfseEnvio`. Valor abaixo segue o padrão
 * 100% consistente observado nos outros três namespaces de operação acima (`{operacao-kebab}-envio-v2_04.xsd`),
 * mas é extrapolação — mesma categoria de risco que já causou os bugs E173/E174 de assinatura em
 * RecepcionarLoteRps/ConsultarLoteRps (só resolvidos com teste ao vivo contra produção). Validar contra o XSD
 * real ou testar ao vivo (com autorização explícita, ver protocolo de teste ao vivo) antes de uso em produção.
 */
export const GISS_CANCELAR_NFSE_ENVIO_NAMESPACE = 'http://www.giss.com.br/cancelar-nfse-envio-v2_04.xsd';
