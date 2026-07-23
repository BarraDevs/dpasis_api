import { XMLParser } from 'fast-xml-parser';
import { GetNfsBatchStatusInputDto, NfsBatchErrorDto, NfsBatchSituation, NfsBatchStatusDto, NfsIssuedNoteDto } from '../../../dtos/nfs-batch-status.dto';
import { GISS_CONSULTAR_LOTE_RPS_ENVIO_NAMESPACE, GISS_TIPOS_NAMESPACE } from './giss-namespaces';

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  isArray: (name) => ['MensagemRetorno', 'CompNfse'].includes(name),
});

function buildCpfCnpj(document: string): string {
  const digits = document.replace(/\D/g, '');
  const tag = digits.length === 11 ? 'Cpf' : 'Cnpj';
  return `<p1:CpfCnpj><p1:${tag}>${digits}</p1:${tag}></p1:CpfCnpj>`;
}

/**
 * `Prestador`/`Protocolo` são declarados diretamente em `consultar-lote-rps-envio-v2_04.xsd` (não vêm de
 * um complexType nomeado em `tipos-v2_04.xsd`), então carregam o prefixo `p` (envio) — só o `CpfCnpj`
 * aninhado (que vem do tipo `tipos:tcIdentificacaoPessoaEmpresa`) fica em `p1` (tipos). Validado com
 * `xmllint --schema consultar-lote-rps-envio-v2_04.xsd` contra o XSD oficial.
 */
export function buildGissConsultarLoteRpsXml(input: GetNfsBatchStatusInputDto): string {
  return `<p:ConsultarLoteRpsEnvio xmlns:p="${GISS_CONSULTAR_LOTE_RPS_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">`
    + `<p:Prestador>${buildCpfCnpj(input.providerDocument)}</p:Prestador>`
    + `<p:Protocolo>${input.batchProtocol}</p:Protocolo>`
    + '</p:ConsultarLoteRpsEnvio>';
}

const SITUATION_MAP: Record<string, NfsBatchSituation> = {
  1: NfsBatchSituation.NotReceived,
  2: NfsBatchSituation.Pending,
  3: NfsBatchSituation.Error,
  4: NfsBatchSituation.Success,
};

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function parseGissConsultarLoteRpsResponse(xml: string): NfsBatchStatusDto {
  const parsed = parser.parse(xml);
  const resposta = parsed?.Envelope?.Body?.ConsultarLoteRpsResposta ?? parsed?.ConsultarLoteRpsResposta;

  if (!resposta) {
    throw new Error('Resposta inesperada do Giss para ConsultarLoteRps: elemento ConsultarLoteRpsResposta não encontrado');
  }

  const situationCode = String(resposta.Situacao ?? '');
  const situation = SITUATION_MAP[situationCode];
  if (!situation) {
    throw new Error(`Situação de lote desconhecida retornada pelo Giss: "${situationCode}"`);
  }

  const errors: NfsBatchErrorDto[] = toArray(resposta.ListaMensagemRetornoLote?.MensagemRetorno)
    .map((msg: any) => ({
      code: String(msg.Codigo ?? ''),
      message: String(msg.Mensagem ?? ''),
      rpsNumber: msg.IdentificacaoRps?.Numero !== undefined ? Number(msg.IdentificacaoRps.Numero) : undefined,
      rpsSeries: msg.IdentificacaoRps?.Serie !== undefined ? String(msg.IdentificacaoRps.Serie) : undefined,
    }))
    .concat(
      toArray(resposta.ListaMensagemRetorno?.MensagemRetorno).map((msg: any) => ({
        code: String(msg.Codigo ?? ''),
        message: String(msg.Mensagem ?? ''),
        rpsNumber: undefined,
        rpsSeries: undefined,
      })),
    );

  const issuedNotes: NfsIssuedNoteDto[] = toArray(resposta.ListaNfse?.CompNfse).map((comp: any) => {
    const infNfse = comp.Nfse?.InfNfse;
    const identificacaoRps = infNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Rps?.IdentificacaoRps;

    return {
      rpsNumber: Number(identificacaoRps?.Numero ?? 0),
      rpsSeries: String(identificacaoRps?.Serie ?? ''),
      nfseNumber: String(infNfse?.Numero ?? ''),
      verificationCode: String(infNfse?.CodigoVerificacao ?? ''),
      issueDate: String(infNfse?.DataEmissao ?? ''),
    };
  });

  return {
    situation,
    issuedNotes: issuedNotes.length > 0 ? issuedNotes : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
