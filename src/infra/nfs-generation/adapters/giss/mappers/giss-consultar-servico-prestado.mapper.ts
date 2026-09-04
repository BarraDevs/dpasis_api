import { XMLParser } from 'fast-xml-parser';
import { ListIssuedNfsInputDto, ListIssuedNfsOutputDto } from '../../../dtos/list-issued-nfs.dto';
import { NfsBatchErrorDto, NfsBatchErrorKind, NfsIssuedNoteDto } from '../../../dtos/nfs-batch-status.dto';
import {
  GISS_CONSULTAR_NFSE_SERVICO_PRESTADO_ENVIO_NAMESPACE,
  GISS_TIPOS_NAMESPACE,
} from '../constants/giss-namespaces';
import { toNfsBatchErrorDto } from './giss-batch-error';
import { toNfsIssuedNoteDto } from './giss-comp-nfse.reader';

/** Teto de página fixado pelo XSD (`maxOccurs="50"` em `ListaNfse/CompNfse`). */
export const GISS_NOTES_PER_PAGE = 50;

export class GissConsultarServicoPrestadoMapper {
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
   * Forma validada contra a produção de Mauá (roteiro em
   * `prisma/seeds/giss-consultar-servico-prestado-manual-test.ts`): `Prestador` com CNPJ **e**
   * inscrição municipal, `PeriodoEmissao` e `Pagina`. `Prestador` vem do complexType de
   * `tipos-v2_04.xsd` (campos em `p1`); `PeriodoEmissao` e `Pagina` são declarados no schema de
   * envio (prefixo `p`).
   */
  public static buildConsultarNfseServicoPrestadoXml(input: ListIssuedNfsInputDto): string {
    const municipalRegistration = input.providerMunicipalRegistration
      ? `<p1:InscricaoMunicipal>${input.providerMunicipalRegistration}</p1:InscricaoMunicipal>`
      : '';

    return '<p:ConsultarNfseServicoPrestadoEnvio '
      + `xmlns:p="${GISS_CONSULTAR_NFSE_SERVICO_PRESTADO_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">`
      + `<p:Prestador>${this.buildCpfCnpj(input.providerDocument)}${municipalRegistration}</p:Prestador>`
      + '<p:PeriodoEmissao>'
      + `<p:DataInicial>${input.startDate}</p:DataInicial>`
      + `<p:DataFinal>${input.endDate}</p:DataFinal>`
      + '</p:PeriodoEmissao>'
      + `<p:Pagina>${input.page}</p:Pagina>`
      + '</p:ConsultarNfseServicoPrestadoEnvio>';
  }

  /**
   * `xsd:choice` entre `ListaNfse` e `ListaMensagemRetorno`. A página seguinte à última devolve
   * `E212` (`NotFound`) — fim da paginação, não falha (§9, RRR2). Qualquer outro código em
   * `ListaMensagemRetorno` é erro da consulta e **não** encerra a paginação.
   */
  public static parseConsultarNfseServicoPrestadoResponse(xml: string): ListIssuedNfsOutputDto {
    const parsed = this.PARSER.parse(xml);
    const resposta = parsed?.Envelope?.Body?.ConsultarNfseServicoPrestadoResposta
      ?? parsed?.ConsultarNfseServicoPrestadoResposta;

    if (!resposta) {
      throw new Error(
        'Resposta inesperada do Giss para ConsultarNfseServicoPrestado: elemento ConsultarNfseServicoPrestadoResposta não encontrado',
      );
    }

    const notes: NfsIssuedNoteDto[] = this.toArray(resposta.ListaNfse?.CompNfse).map(toNfsIssuedNoteDto);
    if (notes.length > 0) {
      return { notes, endOfPages: notes.length < GISS_NOTES_PER_PAGE };
    }

    const errors: NfsBatchErrorDto[] = this.toArray(resposta.ListaMensagemRetorno?.MensagemRetorno).map((msg: any) =>
      toNfsBatchErrorDto(msg, { includeRpsIdentification: false }),
    );

    if (errors.length === 0) {
      throw new Error(
        'Resposta inesperada do Giss para ConsultarNfseServicoPrestado: nem ListaNfse nem ListaMensagemRetorno',
      );
    }

    const onlyNotFound = errors.every((error) => error.kind === NfsBatchErrorKind.NotFound);

    return { notes: [], endOfPages: onlyNotFound, errors: onlyNotFound ? undefined : errors };
  }
}
