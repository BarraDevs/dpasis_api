/**
 * O certificado A1 do Giss não é versionado (P0-07 de `docs/auditoria-nfm-resiliencia.md`):
 * `GISS_CERT_PATH` é a única fonte do caminho.
 *
 * Não existe caminho padrão de propósito. O fallback anterior apontava para o arquivo em
 * `resources/`, e um fallback aqui faz duas coisas ruins: esconde configuração ausente e grava em
 * `nfs_provider_configs.certFilePath` um caminho que talvez não seja o do certificado em uso — o
 * seed passa, e a emissão quebra depois, longe da causa.
 *
 * Lida sob demanda, não no carregamento do módulo: `find-elegible-clients-nfm` entra no
 * `npm run db:seed` junto com os outros seeds, e um `throw` no import derrubaria todos eles por
 * causa de uma variável que só este trecho precisa.
 */
export function requireGissCertPath(): string {
  const certFilePath = process.env.GISS_CERT_PATH?.trim();

  if (!certFilePath) {
    throw new Error(
      'GISS_CERT_PATH não está definida. O certificado A1 não é versionado: aponte a variável para '
      + 'o arquivo .pfx antes de rodar este seed (ver docs/runbook-certificados.md).',
    );
  }

  return certFilePath;
}
