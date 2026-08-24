import { XMLParser } from 'fast-xml-parser';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from '../../../dtos/issue-nfs-batch.dto';
import { NfsIbsCbsDto } from '../../../dtos/nfs-ibs-cbs.dto';
import { NfsPartyDto } from '../../../dtos/nfs-party.dto';
import { NfsRpsDto } from '../../../dtos/nfs-rps.dto';
import { NfsServiceDto } from '../../../dtos/nfs-service.dto';
import { NfsTakerDto } from '../../../dtos/nfs-taker.dto';
import { GISS_ENVIAR_LOTE_RPS_ENVIO_NAMESPACE, GISS_TIPOS_NAMESPACE } from '../constants/giss-namespaces';
import { XmlEscapeUtil } from './xml-escape.util';

export class GissIssueBatchMapper {
  private static readonly RESPONSE_PARSER = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });
  private static readonly LEIAUTE_VERSION = '2.04';

  private static yesNo(value: boolean): 1 | 2 {
    return value ? 1 : 2;
  }

  private static normalizeCodigoNbs(code: string): string {
    return code.replace(/\D/g, '').slice(0, 9);
  }

  private static resolveIssValue(s: NfsServiceDto): number | undefined {
    if (s.issValue !== undefined) {
      return s.issValue;
    }
    if (s.issRate !== undefined) {
      return s.servicesValue * s.issRate;
    }
    if (s.issWithheld) {
      return 0;
    }
    return undefined;
  }

  private static buildFederalTrib(): string {
    return '<p1:trib>'
      + '<p1:tribFed>'
      + '<p1:piscofins>'
      + '<p1:CST>00</p1:CST>'
      + '</p1:piscofins>'
      + '</p1:tribFed>'
      + '<p1:totTrib>'
      + '<p1:pTotTrib>'
      + '<p1:pTotTribFed>0.00</p1:pTotTribFed>'
      + '<p1:pTotTribEst>0.00</p1:pTotTribEst>'
      + '<p1:pTotTribMun>0.00</p1:pTotTribMun>'
      + '</p1:pTotTrib>'
      + '</p1:totTrib>'
      + '</p1:trib>';
  }

  private static buildIbscbs(ibsCbs: NfsIbsCbsDto, serviceMunicipalCodeIbge: string): string {
    const finNFSe = ibsCbs.finNFSe ?? 0;
    const indFinal = ibsCbs.indFinal ?? 0;
    const indDest = ibsCbs.indDest ?? 0;
    const cst = ibsCbs.cst ?? '000';
    const cClassTrib = ibsCbs.cClassTrib ?? '000001';
    const pRedutor = (ibsCbs.pRedutor ?? 0).toFixed(2);

    return '<p1:IBSCBS>'
      + `<p1:finNFSe>${finNFSe}</p1:finNFSe>`
      + `<p1:indFinal>${indFinal}</p1:indFinal>`
      + `<p1:cIndOp>${XmlEscapeUtil.escape(ibsCbs.indopCode)}</p1:cIndOp>`
      + `<p1:indDest>${indDest}</p1:indDest>`
      + '<p1:valores>'
      + '<p1:trib><p1:gIBSCBS>'
      + `<p1:CST>${XmlEscapeUtil.escape(cst)}</p1:CST>`
      + `<p1:cClassTrib>${XmlEscapeUtil.escape(cClassTrib)}</p1:cClassTrib>`
      + '</p1:gIBSCBS></p1:trib>'
      + `<p1:cLocalidadeIncid>${serviceMunicipalCodeIbge}</p1:cLocalidadeIncid>`
      + `<p1:pRedutor>${pRedutor}</p1:pRedutor>`
      + '</p1:valores>'
      + '</p1:IBSCBS>';
  }

  // Separate, deliberately duplicated from GissBatchStatusMapper.buildCpfCnpj — do not merge.
  private static buildCpfCnpj(document: string): string {
    const digits = document.replace(/\D/g, '');
    const tag = digits.length === 11 ? 'Cpf' : 'Cnpj';
    return `<p1:CpfCnpj><p1:${tag}>${digits}</p1:${tag}></p1:CpfCnpj>`;
  }

  private static buildProvider(provider: NfsPartyDto): string {
    return `<p1:Prestador>${this.buildCpfCnpj(provider.document)}${
      provider.municipalRegistration ? `<p1:InscricaoMunicipal>${XmlEscapeUtil.escape(provider.municipalRegistration)}</p1:InscricaoMunicipal>` : ''
    }</p1:Prestador>`;
  }

  private static buildTaker(taker: NfsTakerDto | undefined): string {
    if (!taker) {
      return '';
    }

    const identification = taker.identification
      ? `<p1:IdentificacaoTomador>${this.buildCpfCnpj(taker.identification.document)}${
        taker.identification.municipalRegistration ? `<p1:InscricaoMunicipal>${XmlEscapeUtil.escape(taker.identification.municipalRegistration)}</p1:InscricaoMunicipal>` : ''
      }</p1:IdentificacaoTomador>`
      : '';

    const address = taker.address
      ? '<p1:Endereco>'
        + `<p1:Endereco>${XmlEscapeUtil.escape(taker.address.street)}</p1:Endereco>`
        + `<p1:Numero>${XmlEscapeUtil.escape(taker.address.number)}</p1:Numero>`
        + (taker.address.complement ? `<p1:Complemento>${XmlEscapeUtil.escape(taker.address.complement)}</p1:Complemento>` : '')
        + `<p1:Bairro>${XmlEscapeUtil.escape(taker.address.neighborhood)}</p1:Bairro>`
        + `<p1:CodigoMunicipio>${taker.address.cityCodeIbge}</p1:CodigoMunicipio>`
        + `<p1:Uf>${taker.address.state}</p1:Uf>`
        + `<p1:Cep>${taker.address.zipCode}</p1:Cep>`
        + '</p1:Endereco>'
      : '';

    const contact = taker.email
      ? `<p1:Contato><p1:Email>${XmlEscapeUtil.escape(taker.email)}</p1:Email></p1:Contato>`
      : (taker.phone ? `<p1:Contato><p1:Telefone>${XmlEscapeUtil.escape(taker.phone)}</p1:Telefone></p1:Contato>` : '');

    return `<p1:TomadorServico>${identification}<p1:RazaoSocial>${XmlEscapeUtil.escape(taker.companyName)}</p1:RazaoSocial>${address}${contact}</p1:TomadorServico>`;
  }

  private static buildService(rps: NfsRpsDto): string {
    const s = rps.service;
    const issValue = this.resolveIssValue(s);
    const shouldEmitIssValue = issValue !== undefined && (s.issWithheld || s.issValue !== undefined || s.issRate !== undefined);

    const valores = '<p1:Valores>'
      + `<p1:ValorServicos>${s.servicesValue.toFixed(2)}</p1:ValorServicos>`
      + (s.deductionsValue !== undefined ? `<p1:ValorDeducoes>${s.deductionsValue.toFixed(2)}</p1:ValorDeducoes>` : '')
      + (s.inssValue !== undefined ? `<p1:ValorInss>${s.inssValue.toFixed(2)}</p1:ValorInss>` : '')
      + (s.irValue !== undefined ? `<p1:ValorIr>${s.irValue.toFixed(2)}</p1:ValorIr>` : '')
      + (s.csllValue !== undefined ? `<p1:ValorCsll>${s.csllValue.toFixed(2)}</p1:ValorCsll>` : '')
      + (s.otherWithholdingsValue !== undefined ? `<p1:OutrasRetencoes>${s.otherWithholdingsValue.toFixed(2)}</p1:OutrasRetencoes>` : '')
      + (shouldEmitIssValue ? `<p1:ValorIss>${issValue!.toFixed(2)}</p1:ValorIss>` : '')
      + (s.issRate !== undefined ? `<p1:Aliquota>${s.issRate.toFixed(4)}</p1:Aliquota>` : '')
      + (s.unconditionalDiscount !== undefined ? `<p1:DescontoIncondicionado>${s.unconditionalDiscount.toFixed(2)}</p1:DescontoIncondicionado>` : '')
      + (s.conditionalDiscount !== undefined ? `<p1:DescontoCondicionado>${s.conditionalDiscount.toFixed(2)}</p1:DescontoCondicionado>` : '')
      + this.buildFederalTrib()
      + this.buildIbscbs(s.ibsCbs, s.serviceMunicipalCodeIbge)
      + '</p1:Valores>';

    const responsavelRetencao = s.issWithheld
      ? `<p1:ResponsavelRetencao>${s.issRetentionResponsible ?? 1}</p1:ResponsavelRetencao>`
      : '';

    return `<p1:Servico>${valores}`
      + `<p1:IssRetido>${this.yesNo(s.issWithheld)}</p1:IssRetido>`
      + responsavelRetencao
      + `<p1:ItemListaServico>${XmlEscapeUtil.escape(s.serviceListItemCode)}</p1:ItemListaServico>`
      + (s.cnaeCode ? `<p1:CodigoCnae>${s.cnaeCode}</p1:CodigoCnae>` : '')
      + (s.municipalTaxCode ? `<p1:CodigoTributacaoMunicipio>${XmlEscapeUtil.escape(s.municipalTaxCode)}</p1:CodigoTributacaoMunicipio>` : '')
      + `<p1:CodigoNbs>${this.normalizeCodigoNbs(s.nbsCode)}</p1:CodigoNbs>`
      + `<p1:Discriminacao>${XmlEscapeUtil.escape(s.description)}</p1:Discriminacao>`
      + `<p1:CodigoMunicipio>${s.serviceMunicipalCodeIbge}</p1:CodigoMunicipio>`
      // CodigoPais é opcional no XSD (tsCodigoPaisIbge) mas o Giss rejeita em runtime sem ele (E383).
      // "1058" (padrão IBGE/BACEN pra Brasil, usado em NFe/NFSe em geral) foi rejeitado pelo Giss em
      // produção com E384 ("Código do pais informado não existe") — confirmado com outro desenvolvedor
      // que a tabela de países usada pela Giss usa "0076" pra Brasil (assume-se serviço prestado no
      // Brasil; v1 não cobre prestação de serviço no exterior).
      + '<p1:CodigoPais>0076</p1:CodigoPais>'
      + `<p1:ExigibilidadeISS>${s.issExigibility}</p1:ExigibilidadeISS>`
      // MunicipioIncidencia é opcional no XSD, mas o Giss rejeita em runtime sem ele (E310 "Código do
      // município de incidência do ISSQN incorreto"). Sem regra de transferência de incidência informada,
      // assume-se que o ISS incide no mesmo município onde o serviço foi prestado.
      + `<p1:MunicipioIncidencia>${s.serviceMunicipalCodeIbge}</p1:MunicipioIncidencia>`
      + '</p1:Servico>';
  }

  private static buildRps(rps: NfsRpsDto, index: number): string {
    const infId = `rps${index}`;

    const infDeclaracao = `<p1:InfDeclaracaoPrestacaoServico Id="${infId}">`
      + '<p1:Rps>'
      + '<p1:IdentificacaoRps>'
      + `<p1:Numero>${rps.rpsNumber}</p1:Numero>`
      + `<p1:Serie>${XmlEscapeUtil.escape(rps.rpsSeries)}</p1:Serie>`
      + `<p1:Tipo>${rps.rpsType}</p1:Tipo>`
      + '</p1:IdentificacaoRps>'
      + `<p1:DataEmissao>${rps.issueDate}</p1:DataEmissao>`
      + '<p1:Status>1</p1:Status>'
      + '</p1:Rps>'
      + `<p1:Competencia>${rps.competence}</p1:Competencia>`
      + this.buildService(rps)
      + this.buildProvider(rps.provider)
      + this.buildTaker(rps.taker)
      + `<p1:OptanteSimplesNacional>${this.yesNo(rps.simpleNationalOptant)}</p1:OptanteSimplesNacional>`
      + `<p1:IncentivoFiscal>${this.yesNo(rps.fiscalIncentive)}</p1:IncentivoFiscal>`
      + (rps.additionalInformation ? `<p1:InformacoesComplementares>${XmlEscapeUtil.escape(rps.additionalInformation)}</p1:InformacoesComplementares>` : '')
      + '</p1:InfDeclaracaoPrestacaoServico>';

    return `<p1:Rps>${infDeclaracao}</p1:Rps>`;
  }

  /**
   * Monta o XML (não assinado) de `EnviarLoteRpsEnvio`. A assinatura é aplicada depois, por cima deste XML,
   * via `GissXmlSigner.signElementById`: cada RPS individualmente (referenciado pelo próprio `Id`), e o lote
   * inteiro por último (referenciado pelo `Id` do `LoteRps`) — validado ao vivo contra produção (protocolo real
   * aceito com esse padrão; a variante sem `Id`/URI vazia no lote regrediu para erro síncrono E173, então
   * foi revertida).
   *
   * Namespaces: `EnviarLoteRpsEnvio`/`LoteRps` (prefixo `p`) pertencem ao schema `enviar-lote-rps-envio-v2_04.xsd`;
   * todos os tipos de negócio aninhados (Prestador, Servico, RPS, etc., prefixo `p1`) pertencem a `tipos-v2_04.xsd`
   * — são dois namespaces distintos, confirmado nos XSDs reais e no exemplo oficial
   * (`gissonline_docs/Exemplo_XML-Servicos_Prestados_20260420.rar`).
   */
  public static buildIssueBatchXml(input: IssueNfsBatchInputDto): { xml: string; loteId: string; rpsIds: string[] } {
    if (input.rpsList.length === 0) {
      throw new Error('Lote de RPS não pode ser vazio');
    }
    if (input.rpsList.length > 50) {
      throw new Error('Lote de RPS não pode ter mais de 50 RPS');
    }

    const loteId = `lote${input.batchNumber}`;
    const provider = input.rpsList[0].provider;
    const rpsIds = input.rpsList.map((_, index) => `rps${index + 1}`);

    const listaRps = input.rpsList.map((rps, index) => this.buildRps(rps, index + 1)).join('');

    const loteRps = `<p:LoteRps Id="${loteId}" versao="${this.LEIAUTE_VERSION}">`
      + `<p1:NumeroLote>${input.batchNumber}</p1:NumeroLote>`
      + this.buildProvider(provider)
      + `<p1:QuantidadeRps>${input.rpsList.length}</p1:QuantidadeRps>`
      + `<p1:ListaRps>${listaRps}</p1:ListaRps>`
      + '</p:LoteRps>';

    const xml = `<p:EnviarLoteRpsEnvio xmlns:p="${GISS_ENVIAR_LOTE_RPS_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">${loteRps}</p:EnviarLoteRpsEnvio>`;

    return { xml, loteId, rpsIds };
  }

  public static parseRecepcionarLoteRpsResponse(xml: string): IssueNfsBatchOutputDto {
    const parsed = this.RESPONSE_PARSER.parse(xml);
    const resposta = parsed?.Envelope?.Body?.EnviarLoteRpsResposta ?? parsed?.EnviarLoteRpsResposta;

    if (!resposta) {
      throw new Error('Resposta inesperada do Giss para RecepcionarLoteRps: elemento EnviarLoteRpsResposta não encontrado');
    }

    const protocolo = resposta.Protocolo;
    if (!protocolo) {
      const mensagens = resposta.ListaMensagemRetorno?.MensagemRetorno;
      const mensagem = Array.isArray(mensagens) ? mensagens[0] : mensagens;
      const detail = mensagem ? `${mensagem.Codigo}: ${mensagem.Mensagem}` : 'sem detalhes na resposta';
      throw new Error(`Giss não retornou protocolo do lote (${detail})`);
    }

    return { batchProtocol: String(protocolo) };
  }
}
