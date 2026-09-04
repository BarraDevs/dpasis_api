/**
 * Consulta manual de NFS-e emitidas por período no Giss (operação `ConsultarNfseServicoPrestado`).
 *
 * Operação **somente leitura**: não gera documento fiscal, não consome numeração de RPS e não altera
 * nada no Giss. Pode ser repetida à vontade — ao contrário de `RecepcionarLoteRps`.
 *
 * Chama o mapper e o cliente SOAP **de produção**: o que se valida aqui é o código que vai rodar.
 * A versão anterior deste script duplicava o envelope à mão, o que servia para descobrir o formato
 * mas deixava de exercitar o adapter.
 *
 * Uso:
 *   dotenv -e .env.development -- ts-node -T -r tsconfig-paths/register \
 *     prisma/seeds/giss-consultar-servico-prestado-manual-test.ts <dataInicial> <dataFinal> [pagina]
 *
 * Exemplo:
 *   ... giss-consultar-servico-prestado-manual-test.ts 2026-07-01 2026-07-31 1
 *
 * Requer `GISS_CERT_PASSWORD` no ambiente. `RAW=1` imprime o XML devolvido pelo provedor. Ver
 * `gissonline_docs/consultar-servico-prestado-postman.md` para o equivalente em Postman/curl e para
 * as medições já feitas.
 */
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { join } from 'node:path';
import { GissConsultarServicoPrestadoMapper } from '../../src/infra/nfs-generation/adapters/giss/mappers/giss-consultar-servico-prestado.mapper';
import { GissPfxLoader } from '../../src/infra/nfs-generation/adapters/giss/signing/giss-pfx-loader';
import { GissXmlSigner } from '../../src/infra/nfs-generation/adapters/giss/signing/giss-xml-signer';
import { GissOperation, GissSoapClient } from '../../src/infra/nfs-generation/adapters/giss/soap/giss-soap-client';
import { NfsProviderEnvironment } from '../../src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';

const PROVIDER_CNPJ = '02099923000178';
const PROVIDER_MUNICIPAL_REGISTRATION = '16895';
const MUNICIPIO_SLUG = 'maua';
const HTTP_TIMEOUT_MS = 60_000;

const LEGACY_CERT_PATH = join(
  __dirname,
  '../../resources/files/nfs-generation/giss/DPA_TEC_EQUIPAMENTOS_DE_PONTO_LTDA_02099923000178.pfx',
);

/** `GISS_CERT_PATH` é a fonte da verdade; `resources/` fica como fallback legado (P0-07). */
const CERT_FILE_PATH = process.env.GISS_CERT_PATH ?? LEGACY_CERT_PATH;

const httpService = { axiosRef: axios.create({ timeout: HTTP_TIMEOUT_MS }) } as unknown as HttpService;

async function main(): Promise<void> {
  const [startDate, endDate, page = '1'] = process.argv.slice(2);

  if (!startDate || !endDate) {
    throw new Error('Uso: <dataInicial> <dataFinal> [pagina] — datas no formato yyyy-MM-dd');
  }

  const input = {
    startDate,
    endDate,
    page: Number(page),
    providerDocument: PROVIDER_CNPJ,
    providerMunicipalRegistration: PROVIDER_MUNICIPAL_REGISTRATION,
    provider: {
      certFilePath: CERT_FILE_PATH,
      certPasswordEnvVar: 'GISS_CERT_PASSWORD',
      environment: NfsProviderEnvironment.Production,
      vendorConfig: { municipioSlug: MUNICIPIO_SLUG },
    },
  };

  const cert = GissPfxLoader.load(CERT_FILE_PATH, 'GISS_CERT_PASSWORD');

  // Assinatura obrigatória apesar de o XSD dizer o contrário: sem ela o Giss devolve `V999`/`E174`.
  const dadosMsg = GissXmlSigner.signWholeDocument(
    GissConsultarServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(input),
    cert,
  );

  const call = await GissSoapClient.postSoapRequest(
    httpService,
    MUNICIPIO_SLUG,
    GissOperation.ConsultarNfseServicoPrestado,
    dadosMsg,
    cert,
  );

  const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(call.outputXml);

  console.log(`${startDate}..${endDate} pagina=${page} | CompNfse=${result.notes.length}`
    + ` | endOfPages=${result.endOfPages}`
    + (result.errors ? ` | ${result.errors.map((e) => `${e.code}/${e.kind}: ${e.message}`).join(' · ')}` : ''));

  if (process.env.RAW) {
    console.log(call.outputXml);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
