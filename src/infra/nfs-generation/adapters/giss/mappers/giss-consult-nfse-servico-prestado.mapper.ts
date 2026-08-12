import { XMLParser } from 'fast-xml-parser';
import { FindNfsServicoPrestadoInputDto, NfsNoteDto, NfsNoteStatus } from '../../../dtos/find-nfs-servico-prestado.dto';
import { GISS_CONSULTAR_NFSE_SERVICO_PRESTADO_ENVIO_NAMESPACE, GISS_TIPOS_NAMESPACE } from '../constants/giss-namespaces';
import { XmlEscapeUtil } from './xml-escape.util';

export class GissConsultNfseServicoPrestadoMapper {
  private static readonly PARSER = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    isArray: (name) => ['MensagemRetorno', 'CompNfse'].includes(name),
  });

  // Separado, deliberadamente duplicado de outros mappers Giss — não unificar.
  private static buildCpfCnpj(document: string): string {
    const digits = document.replace(/\D/g, '');
    const tag = digits.length === 11 ? 'Cpf' : 'Cnpj';
    return `<p1:CpfCnpj><p1:${tag}>${digits}</p1:${tag}></p1:CpfCnpj>`;
  }

  private static buildIdentificacaoPessoaEmpresa(document: string, municipalRegistration?: string): string {
    return this.buildCpfCnpj(document)
      + (municipalRegistration
        ? `<p1:InscricaoMunicipal>${XmlEscapeUtil.escape(municipalRegistration)}</p1:InscricaoMunicipal>`
        : '');
  }

  private static toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private static extractDocument(cpfCnpj: any): string | null {
    if (!cpfCnpj) {
      return null;
    }
    if (cpfCnpj.Cnpj !== undefined && cpfCnpj.Cnpj !== null) {
      return String(cpfCnpj.Cnpj);
    }
    if (cpfCnpj.Cpf !== undefined && cpfCnpj.Cpf !== null) {
      return String(cpfCnpj.Cpf);
    }
    return null;
  }

  /**
   * Prestador/Tomador são `tipos:tcIdentificacaoPessoaEmpresa` referenciados pelo schema de envio;
   * filhos (`CpfCnpj`, `InscricaoMunicipal`) ficam em `p1`. PeriodoEmissao/NumeroNfse/Pagina são
   * elementos do schema de envio (`p`).
   */
  static buildConsultarNfseServicoPrestadoXml(input: FindNfsServicoPrestadoInputDto): string {
    const hasPeriod = input.periodFrom !== undefined && input.periodTo !== undefined;
    const hasNumber = input.nfseNumber !== undefined && input.nfseNumber !== '';

    if (hasPeriod === hasNumber) {
      throw new Error('Informe PeriodoEmissao (periodFrom/periodTo) ou nfseNumber, exclusivamente');
    }

    let choiceXml: string;
    if (hasNumber) {
      choiceXml = `<p:NumeroNfse>${XmlEscapeUtil.escape(String(input.nfseNumber))}</p:NumeroNfse>`;
    }
    else {
      choiceXml = '<p:PeriodoEmissao>'
        + `<p:DataInicial>${XmlEscapeUtil.escape(input.periodFrom!)}</p:DataInicial>`
        + `<p:DataFinal>${XmlEscapeUtil.escape(input.periodTo!)}</p:DataFinal>`
        + '</p:PeriodoEmissao>';
    }

    const tomadorXml = input.takerDocument
      ? `<p:Tomador>${this.buildIdentificacaoPessoaEmpresa(input.takerDocument)}</p:Tomador>`
      : '';

    return `<p:ConsultarNfseServicoPrestadoEnvio xmlns:p="${GISS_CONSULTAR_NFSE_SERVICO_PRESTADO_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">`
      + `<p:Prestador>${this.buildIdentificacaoPessoaEmpresa(input.providerDocument, input.providerMunicipalRegistration)}</p:Prestador>`
      + choiceXml
      + tomadorXml
      + `<p:Pagina>${input.page}</p:Pagina>`
      + '</p:ConsultarNfseServicoPrestadoEnvio>';
  }

  static parseConsultarNfseServicoPrestadoResponse(xml: string): NfsNoteDto[] {
    const parsed = this.PARSER.parse(xml);
    const resposta = parsed?.Envelope?.Body?.ConsultarNfseServicoPrestadoResposta
      ?? parsed?.ConsultarNfseServicoPrestadoResposta;

    if (!resposta) {
      throw new Error('Resposta inesperada do Giss para ConsultarNfseServicoPrestado: elemento ConsultarNfseServicoPrestadoResposta não encontrado');
    }

    const mensagens = this.toArray(resposta.ListaMensagemRetorno?.MensagemRetorno);
    if (mensagens.length > 0 && !resposta.ListaNfse) {
      const first = mensagens[0];
      throw new Error(`Giss rejeitou a consulta (${first.Codigo}: ${first.Mensagem})`);
    }

    return this.toArray(resposta.ListaNfse?.CompNfse).map((comp: any) => {
      const infNfse = comp.Nfse?.InfNfse;
      const declaracao = infNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico;
      const identificacaoRps = declaracao?.Rps?.IdentificacaoRps;
      const tomador = declaracao?.Tomador;
      const valoresServico = declaracao?.Servico?.Valores;
      const valoresNfse = infNfse?.ValoresNfse;
      const canceled = Boolean(comp.NfseCancelamento);

      const serviceAmount = valoresServico?.ValorServicos !== undefined && valoresServico?.ValorServicos !== null
        ? String(valoresServico.ValorServicos)
        : null;
      const liquidAmount = valoresNfse?.ValorLiquidoNfse !== undefined && valoresNfse?.ValorLiquidoNfse !== null
        ? String(valoresNfse.ValorLiquidoNfse)
        : null;
      const takenAmount = serviceAmount ?? liquidAmount;

      return {
        nfseNumber: String(infNfse?.Numero ?? ''),
        verificationCode: String(infNfse?.CodigoVerificacao ?? ''),
        issueDate: String(infNfse?.DataEmissao ?? ''),
        rpsNumber: Number(identificacaoRps?.Numero ?? 0),
        rpsSeries: String(identificacaoRps?.Serie ?? ''),
        takerDocument: this.extractDocument(tomador?.IdentificacaoTomador?.CpfCnpj),
        takerName: tomador?.RazaoSocial !== undefined && tomador?.RazaoSocial !== null
          ? String(tomador.RazaoSocial)
          : null,
        serviceAmount: takenAmount,
        status: canceled ? NfsNoteStatus.Cancelada : NfsNoteStatus.Normal,
      };
    });
  }
}
