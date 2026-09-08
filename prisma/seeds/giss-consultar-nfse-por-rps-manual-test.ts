/**
 * Consulta manual de NFS-e pela chave natural do RPS (operação `ConsultarNfsePorRps`).
 *
 * Operação **somente leitura**: não gera documento fiscal, não consome numeração de RPS e não altera
 * nada no Giss. Pode ser repetida à vontade — ao contrário de `RecepcionarLoteRps`.
 *
 * Diferente do roteiro em `giss-consultar-servico-prestado-manual-test.ts`, este script chama o
 * mapper e o cliente SOAP **de produção**: o que se valida aqui é o código que vai rodar, não uma
 * cópia dele.
 *
 * Uso:
 *   dotenv -e .env.development -- ts-node -T -r tsconfig-paths/register \
 *     prisma/seeds/giss-consultar-nfse-por-rps-manual-test.ts <rpsNumero> [rpsSerie] [tipo]
 *
 * Exemplos:
 *   ... giss-consultar-nfse-por-rps-manual-test.ts 41 NFSE     # RPS conhecido  -> found: true
 *   ... giss-consultar-nfse-por-rps-manual-test.ts 999999 NFSE # RPS inexistente -> found: false
 *
 * Requer `GISS_CERT_PASSWORD` no ambiente. `RAW=1` imprime o XML devolvido pelo provedor.
 */
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { GissConsultarNfseRpsMapper } from '../../src/infra/nfs-generation/adapters/giss/mappers/giss-consultar-nfse-rps.mapper';
import { GissPfxLoader } from '../../src/infra/nfs-generation/adapters/giss/signing/giss-pfx-loader';
import { GissXmlSigner } from '../../src/infra/nfs-generation/adapters/giss/signing/giss-xml-signer';
import { GissOperation, GissSoapClient } from '../../src/infra/nfs-generation/adapters/giss/soap/giss-soap-client';
import { NfsProviderEnvironment } from '../../src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { requireGissCertPath } from './giss-cert-path';

const PROVIDER_CNPJ = '02099923000178';
const PROVIDER_MUNICIPAL_REGISTRATION = '16895';
const MUNICIPIO_SLUG = 'maua';
const HTTP_TIMEOUT_MS = 60_000;

/** O cliente SOAP só usa `axiosRef.post`; um axios cru basta para um script de linha de comando. */
const httpService = { axiosRef: axios.create({ timeout: HTTP_TIMEOUT_MS }) } as unknown as HttpService;

async function main(): Promise<void> {
  const [rpsNumberArg, rpsSeries = 'NFSE', rpsTypeArg = '1'] = process.argv.slice(2);

  if (!rpsNumberArg) {
    throw new Error('Uso: <rpsNumero> [rpsSerie] [tipo]');
  }

  const certFilePath = requireGissCertPath();

  const input = {
    rpsNumber: Number(rpsNumberArg),
    rpsSeries,
    rpsType: Number(rpsTypeArg),
    providerDocument: PROVIDER_CNPJ,
    providerMunicipalRegistration: PROVIDER_MUNICIPAL_REGISTRATION,
    provider: {
      certFilePath,
      certPasswordEnvVar: 'GISS_CERT_PASSWORD',
      environment: NfsProviderEnvironment.Production,
      vendorConfig: { municipioSlug: MUNICIPIO_SLUG },
    },
  };

  const cert = GissPfxLoader.load(certFilePath, 'GISS_CERT_PASSWORD');

  // O XSD declara `dsig:Signature` como minOccurs="0", mas o Giss recusa a consulta sem assinatura
  // (devolve `V999`/`E174`). `ConsultarNfseRpsEnvio` não tem atributo `Id`, então só pode ser
  // assinado como documento inteiro — mesma armadilha de `ConsultarLoteRps`.
  const dadosMsg = GissXmlSigner.signWholeDocument(
    GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(input),
    cert,
  );

  const call = await GissSoapClient.postSoapRequest(
    httpService,
    MUNICIPIO_SLUG,
    GissOperation.ConsultarNfsePorRps,
    dadosMsg,
    cert,
  );

  const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(call.outputXml);

  console.log(`RPS ${input.rpsNumber}/${input.rpsSeries} | found=${result.found}`
    + (result.note ? ` | NFS-e ${result.note.nfseNumber} cod=${result.note.verificationCode} em ${result.note.issueDate}` : '')
    + (result.errors ? ` | ${result.errors.map((e) => `${e.code}/${e.kind}: ${e.message}`).join(' · ')}` : ''));

  if (process.env.RAW) {
    console.log(call.outputXml);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
