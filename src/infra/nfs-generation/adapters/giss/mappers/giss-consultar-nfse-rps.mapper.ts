import { XMLParser } from 'fast-xml-parser';
import { FindNfsByRpsInputDto, FindNfsByRpsOutputDto } from '../../../dtos/find-nfs-by-rps.dto';
import { NfsBatchErrorDto, NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';
import { GISS_CONSULTAR_NFSE_RPS_ENVIO_NAMESPACE, GISS_TIPOS_NAMESPACE } from '../constants/giss-namespaces';
import { toNfsBatchErrorDto } from './giss-batch-error';
import { toNfsIssuedNoteDto } from './giss-comp-nfse.reader';

const DEFAULT_RPS_TYPE = 1;

export class GissConsultarNfseRpsMapper {
  private static readonly PARSER = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    isArray: (name) => ['MensagemRetorno', 'CompNfse'].includes(name),
  });

  private static buildCpfCnpj(document: string): string {
    const digits = document.replace(/\D/g, '');
    const tag = digits.length === 11 ? 'Cpf' : 'Cnpj';
    return `<p1:CpfCnpj><p1:${tag}>${digits}</p1:${tag}></p1:CpfCnpj>`;
  }

  private static toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  /**
   * `consultar-nfse-rps-envio-v2_04.xsd` declara a sequência como `IdentificacaoRps` **e depois**
   * `Prestador` — ordem invertida em relação ao `ConsultarLoteRpsEnvio`, e `xsd:sequence` não perdoa.
   * Os dois vêm de complexTypes de `tipos-v2_04.xsd`, então os campos internos carregam o prefixo
   * `p1`; só os elementos declarados no próprio schema de envio ficam em `p`.
   */
  public static buildConsultarNfsePorRpsXml(input: FindNfsByRpsInputDto): string {
    const municipalRegistration = input.providerMunicipalRegistration
      ? `<p1:InscricaoMunicipal>${input.providerMunicipalRegistration}</p1:InscricaoMunicipal>`
      : '';

    return `<p:ConsultarNfseRpsEnvio xmlns:p="${GISS_CONSULTAR_NFSE_RPS_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">`
      + '<p:IdentificacaoRps>'
      + `<p1:Numero>${input.rpsNumber}</p1:Numero>`
      + `<p1:Serie>${input.rpsSeries}</p1:Serie>`
      + `<p1:Tipo>${input.rpsType ?? DEFAULT_RPS_TYPE}</p1:Tipo>`
      + '</p:IdentificacaoRps>'
      + `<p:Prestador>${this.buildCpfCnpj(input.providerDocument)}${municipalRegistration}</p:Prestador>`
      + '</p:ConsultarNfseRpsEnvio>';
  }

  /**
   * A resposta é um `xsd:choice`: ou `CompNfse` (a nota existe) ou `ListaMensagemRetorno`. "Não
   * existe" chega como mensagem de erro, e é resposta — não falha. Só um código que não seja
   * `NotFound` significa que a consulta em si deu errado, e mesmo aí o chamador decide: devolvemos
   * as mensagens em vez de lançar.
   */
  public static parseConsultarNfsePorRpsResponse(xml: string): FindNfsByRpsOutputDto {
    const parsed = this.PARSER.parse(xml);
    const resposta = parsed?.Envelope?.Body?.ConsultarNfseRpsResposta ?? parsed?.ConsultarNfseRpsResposta;

    if (!resposta) {
      throw new Error('Resposta inesperada do Giss para ConsultarNfsePorRps: elemento ConsultarNfseRpsResposta não encontrado');
    }

    const comp = this.toArray(resposta.CompNfse)[0];
    if (comp) {
      return { found: true, note: toNfsIssuedNoteDto(comp) };
    }

    const errors: NfsBatchErrorDto[] = this.toArray(resposta.ListaMensagemRetorno?.MensagemRetorno).map((msg: any) =>
      toNfsBatchErrorDto(msg, { includeRpsIdentification: false }),
    );

    if (errors.length === 0) {
      throw new Error('Resposta inesperada do Giss para ConsultarNfsePorRps: nem CompNfse nem ListaMensagemRetorno');
    }

    return { found: false, errors };
  }

  /** `true` quando todas as mensagens são "não encontrada" — o caso normal de RPS ainda não emitido. */
  public static isNotFound(errors: NfsBatchErrorDto[] | undefined): boolean {
    return !!errors?.length && errors.every((error) => error.kind === NfsBatchErrorKind.NotFound);
  }
}
