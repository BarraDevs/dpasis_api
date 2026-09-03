/**
 * Consulta manual de NFS-e emitidas por período no Giss (operação `ConsultarNfseServicoPrestado`).
 *
 * Operação **somente leitura**: não gera documento fiscal, não consome numeração de RPS e não altera
 * nada no Giss. Pode ser repetida à vontade — ao contrário de `RecepcionarLoteRps`.
 *
 * Uso:
 *   dotenv -e .env.development -- ts-node -T -r tsconfig-paths/register \
 *     prisma/seeds/giss-consultar-servico-prestado-manual-test.ts <dataInicial> <dataFinal> [pagina]
 *
 * Exemplo:
 *   ... giss-consultar-servico-prestado-manual-test.ts 2026-07-01 2026-07-31 1
 *
 * Requer `GISS_CERT_PASSWORD` no ambiente. Ver `gissonline_docs/consultar-servico-prestado-postman.md`
 * para o equivalente em Postman/curl e para o resultado das medições já feitas.
 */
import * as https from 'node:https';
import { join } from 'node:path';
import { GissPfxLoader } from '../../src/infra/nfs-generation/adapters/giss/signing/giss-pfx-loader';
import { GissXmlSigner } from '../../src/infra/nfs-generation/adapters/giss/signing/giss-xml-signer';

const PROVIDER_CNPJ = '02099923000178';
const PROVIDER_MUNICIPAL_REGISTRATION = '16895';
const MUNICIPIO_SLUG = 'maua';

const LEGACY_CERT_PATH = join(
  __dirname,
  '../../resources/files/nfs-generation/giss/DPA_TEC_EQUIPAMENTOS_DE_PONTO_LTDA_02099923000178.pfx',
);

/** `GISS_CERT_PATH` é a fonte da verdade; `resources/` fica como fallback legado (P0-07). */
const CERT_FILE_PATH = process.env.GISS_CERT_PATH ?? LEGACY_CERT_PATH;

const CABECALHO_NAMESPACE = 'http://www.giss.com.br/cabecalho-v2_04.xsd';
const ENVIO_NAMESPACE = 'http://www.giss.com.br/consultar-nfse-servico-prestado-envio-v2_04.xsd';
const TIPOS_NAMESPACE = 'http://www.giss.com.br/tipos-v2_04.xsd';
const WRAPPER_NAMESPACE = 'http://nfse.abrasf.org.br';
const OPERATION = 'ConsultarNfseServicoPrestado';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function buildDadosMsg(startDate: string, endDate: string, page: string): string {
  return `<p:ConsultarNfseServicoPrestadoEnvio xmlns:p="${ENVIO_NAMESPACE}" xmlns:p1="${TIPOS_NAMESPACE}">`
    + '<p:Prestador>'
    + `<p1:CpfCnpj><p1:Cnpj>${PROVIDER_CNPJ}</p1:Cnpj></p1:CpfCnpj>`
    + `<p1:InscricaoMunicipal>${PROVIDER_MUNICIPAL_REGISTRATION}</p1:InscricaoMunicipal>`
    + '</p:Prestador>'
    + '<p:PeriodoEmissao>'
    + `<p:DataInicial>${startDate}</p:DataInicial>`
    + `<p:DataFinal>${endDate}</p:DataFinal>`
    + '</p:PeriodoEmissao>'
    + `<p:Pagina>${page}</p:Pagina>`
    + '</p:ConsultarNfseServicoPrestadoEnvio>';
}

function buildEnvelope(dadosMsgXml: string): string {
  const cabecalho = `<p:cabecalho versao="2.04" xmlns:p="${CABECALHO_NAMESPACE}">`
    + '<p:versaoDados>2.04</p:versaoDados></p:cabecalho>';

  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>'
    + `<${OPERATION}Request xmlns="${WRAPPER_NAMESPACE}">`
    + `<nfseCabecMsg xmlns="">${escapeXml(cabecalho)}</nfseCabecMsg>`
    + `<nfseDadosMsg xmlns="">${escapeXml(dadosMsgXml)}</nfseDadosMsg>`
    + `</${OPERATION}Request>`
    + '</soapenv:Body></soapenv:Envelope>';
}

async function post(body: string, certPem: string, keyPem: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host: `ws-${MUNICIPIO_SLUG}.giss.com.br`,
        port: 443,
        method: 'POST',
        path: '/service-ws/nf/nfse-ws',
        cert: certPem,
        key: keyPem,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.2',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: `${WRAPPER_NAMESPACE}/${OPERATION}`,
        },
      },
      (response) => {
        let payload = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { payload += chunk; });
        response.on('end', () => resolve(payload));
      },
    );

    request.on('error', reject);
    request.end(body);
  });
}

async function main(): Promise<void> {
  const [startDate, endDate, page = '1'] = process.argv.slice(2);

  if (!startDate || !endDate) {
    throw new Error('Uso: <dataInicial> <dataFinal> [pagina] — datas no formato yyyy-MM-dd');
  }

  const cert = GissPfxLoader.load(CERT_FILE_PATH, 'GISS_CERT_PASSWORD');

  // O XSD declara `dsig:Signature` como minOccurs="0", mas o Giss recusa a consulta sem assinatura
  // (devolve `V999`/`E174`). `ConsultarNfseServicoPrestadoEnvio` não tem atributo `Id`, então só pode
  // ser assinado como documento inteiro — mesma situação de `ConsultarLoteRpsEnvio`.
  const dadosMsg = GissXmlSigner.signWholeDocument(buildDadosMsg(startDate, endDate, page), cert);

  const responseXml = await post(buildEnvelope(dadosMsg), cert.certPem, cert.keyPem);
  const outputXml = /<outputXML>([\s\S]*?)<\/outputXML>/.exec(responseXml);

  if (!outputXml) {
    console.log(responseXml);
    return;
  }

  const output = unescapeXml(outputXml[1]);
  const notes = (output.match(/<[a-z0-9]*:?CompNfse>/g) ?? []).length;
  const message = /<[a-z0-9]*:?Codigo>([^<]*)<\/[a-z0-9]*:?Codigo><[a-z0-9]*:?Mensagem>([^<]*)</.exec(output);

  console.log(`${startDate}..${endDate} pagina=${page} | CompNfse=${notes}`
    + (message ? ` | ${message[1]}/${message[2]}` : ''));

  if (process.env.RAW) {
    console.log(output);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
