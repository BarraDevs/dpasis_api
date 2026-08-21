import { XMLParser } from 'fast-xml-parser';
import {
  FindNfsServicoPrestadoInputDto,
  NfsNoteAddressDto,
  NfsNoteDto,
  NfsNotePartyDto,
  NfsNoteServiceDto,
  NfsNoteStatus,
  NfsNoteValuesDto,
} from '../../../dtos/find-nfs-servico-prestado.dto';
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
      return this.toPaddedDigits(cpfCnpj.Cnpj, 14);
    }
    if (cpfCnpj.Cpf !== undefined && cpfCnpj.Cpf !== null) {
      return this.toPaddedDigits(cpfCnpj.Cpf, 11);
    }
    return null;
  }

  private static toNullableString(value: unknown): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return String(value);
  }

  private static toPaddedDigits(value: unknown, length: number): string | null {
    const raw = this.toNullableString(value);
    if (raw === null) {
      return null;
    }
    const digits = raw.replace(/\D/g, '');
    if (digits === '') {
      return null;
    }
    return digits.padStart(length, '0');
  }

  private static toNullableNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private static toAbrasfBoolean(value: unknown): boolean | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return Number(value) === 1;
  }

  private static mapAddress(endereco: any): NfsNoteAddressDto | null {
    if (!endereco) {
      return null;
    }
    return {
      street: this.toNullableString(endereco.Endereco),
      number: this.toNullableString(endereco.Numero),
      complement: this.toNullableString(endereco.Complemento),
      neighborhood: this.toNullableString(endereco.Bairro),
      cityCodeIbge: this.toPaddedDigits(endereco.CodigoMunicipio, 7),
      state: this.toNullableString(endereco.Uf),
      zipCode: this.toPaddedDigits(endereco.Cep, 8),
    };
  }

  private static mapParty(params: {
    document: string | null;
    name: unknown;
    municipalRegistration: unknown;
    contato: any;
    endereco: any;
  }): NfsNotePartyDto {
    return {
      document: params.document,
      name: this.toNullableString(params.name),
      municipalRegistration: this.toNullableString(params.municipalRegistration),
      email: this.toNullableString(params.contato?.Email),
      phone: this.toNullableString(params.contato?.Telefone),
      address: this.mapAddress(params.endereco),
    };
  }

  private static mapValues(valoresServico: any, valoresNfse: any, serviceAmount: string | null, liquidAmount: string | null): NfsNoteValuesDto {
    return {
      serviceAmount,
      liquidAmount,
      calculationBase: this.toNullableString(valoresNfse?.BaseCalculo),
      issRate: this.toNullableString(valoresNfse?.Aliquota ?? valoresServico?.Aliquota),
      issAmount: this.toNullableString(valoresNfse?.ValorIss ?? valoresServico?.ValorIss),
      deductionsAmount: this.toNullableString(valoresServico?.ValorDeducoes),
      inssAmount: this.toNullableString(valoresServico?.ValorInss),
      irAmount: this.toNullableString(valoresServico?.ValorIr),
      csllAmount: this.toNullableString(valoresServico?.ValorCsll),
      otherWithholdingsAmount: this.toNullableString(valoresServico?.OutrasRetencoes),
      unconditionalDiscount: this.toNullableString(valoresServico?.DescontoIncondicionado),
      conditionalDiscount: this.toNullableString(valoresServico?.DescontoCondicionado),
    };
  }

  private static mapService(servico: any, municipalTaxCodeDescription: unknown): NfsNoteServiceDto {
    return {
      description: this.toNullableString(servico?.Discriminacao),
      serviceListItemCode: this.toNullableString(servico?.ItemListaServico),
      municipalTaxCode: this.toNullableString(servico?.CodigoTributacaoMunicipio),
      municipalTaxCodeDescription: this.toNullableString(municipalTaxCodeDescription),
      nbsCode: this.toNullableString(servico?.CodigoNbs),
      municipalityCode: this.toPaddedDigits(servico?.CodigoMunicipio, 7),
      countryCode: this.toPaddedDigits(servico?.CodigoPais, 4),
      incidenceMunicipalityCode: this.toPaddedDigits(servico?.MunicipioIncidencia, 7),
      issWithheld: this.toAbrasfBoolean(servico?.IssRetido),
      issExigibility: this.toNullableNumber(servico?.ExigibilidadeISS),
    };
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
      const prestadorServico = infNfse?.PrestadorServico;
      const prestador = declaracao?.Prestador;
      const tomador = declaracao?.TomadorServico ?? declaracao?.Tomador;
      const servico = declaracao?.Servico;
      const valoresServico = servico?.Valores;
      const valoresNfse = infNfse?.ValoresNfse;
      const canceled = Boolean(comp.NfseCancelamento);

      const serviceAmount = this.toNullableString(valoresServico?.ValorServicos);
      const liquidAmount = this.toNullableString(valoresNfse?.ValorLiquidoNfse);
      const takerDocument = this.extractDocument(tomador?.IdentificacaoTomador?.CpfCnpj);
      const takerName = this.toNullableString(tomador?.RazaoSocial);

      return {
        nfseNumber: String(infNfse?.Numero ?? ''),
        verificationCode: String(infNfse?.CodigoVerificacao ?? ''),
        issueDate: String(infNfse?.DataEmissao ?? ''),
        competence: this.toNullableString(declaracao?.Competencia),
        rpsNumber: Number(identificacaoRps?.Numero ?? 0),
        rpsSeries: String(identificacaoRps?.Serie ?? ''),
        rpsType: this.toNullableNumber(identificacaoRps?.Tipo),
        rpsIssueDate: this.toNullableString(declaracao?.Rps?.DataEmissao),
        takerDocument,
        takerName,
        serviceAmount: serviceAmount ?? liquidAmount,
        liquidAmount,
        status: canceled ? NfsNoteStatus.Cancelada : NfsNoteStatus.Normal,
        simpleNationalOptant: this.toAbrasfBoolean(declaracao?.OptanteSimplesNacional),
        fiscalIncentive: this.toAbrasfBoolean(declaracao?.IncentivoFiscal),
        generatorMunicipalityCode: this.toPaddedDigits(infNfse?.OrgaoGerador?.CodigoMunicipio, 7),
        generatorUf: this.toNullableString(infNfse?.OrgaoGerador?.Uf),
        provider: this.mapParty({
          document: this.extractDocument(prestador?.CpfCnpj),
          name: prestadorServico?.RazaoSocial,
          municipalRegistration: prestador?.InscricaoMunicipal,
          contato: prestadorServico?.Contato,
          endereco: prestadorServico?.Endereco,
        }),
        taker: this.mapParty({
          document: takerDocument,
          name: takerName,
          municipalRegistration: tomador?.IdentificacaoTomador?.InscricaoMunicipal,
          contato: tomador?.Contato,
          endereco: tomador?.Endereco,
        }),
        values: this.mapValues(valoresServico, valoresNfse, serviceAmount, liquidAmount),
        service: this.mapService(servico, infNfse?.DescricaoCodigoTributacaoMunicipio),
      };
    });
  }
}
