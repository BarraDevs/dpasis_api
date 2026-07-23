import { XMLParser } from 'fast-xml-parser';
import { IssueNfsBatchInputDto, IssueNfsBatchOutputDto } from '../../../dtos/issue-nfs-batch.dto';
import { NfsPartyDto } from '../../../dtos/nfs-party.dto';
import { NfsRpsDto } from '../../../dtos/nfs-rps.dto';
import { NfsTakerDto } from '../../../dtos/nfs-taker.dto';
import { GISS_ENVIAR_LOTE_RPS_ENVIO_NAMESPACE, GISS_TIPOS_NAMESPACE } from './giss-namespaces';
import { escapeXml } from './xml-escape.util';

const responseParser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });

const LEIAUTE_VERSION = '2.04';

function yesNo(value: boolean): 1 | 2 {
  return value ? 1 : 2;
}

function buildCpfCnpj(document: string): string {
  const digits = document.replace(/\D/g, '');
  const tag = digits.length === 11 ? 'Cpf' : 'Cnpj';
  return `<p1:CpfCnpj><p1:${tag}>${digits}</p1:${tag}></p1:CpfCnpj>`;
}

function buildProvider(provider: NfsPartyDto): string {
  return `<p1:Prestador>${buildCpfCnpj(provider.document)}${
    provider.municipalRegistration ? `<p1:InscricaoMunicipal>${escapeXml(provider.municipalRegistration)}</p1:InscricaoMunicipal>` : ''
  }</p1:Prestador>`;
}

function buildTaker(taker: NfsTakerDto | undefined): string {
  if (!taker) {
    return '';
  }

  const identification = taker.identification
    ? `<p1:IdentificacaoTomador>${buildCpfCnpj(taker.identification.document)}${
      taker.identification.municipalRegistration ? `<p1:InscricaoMunicipal>${escapeXml(taker.identification.municipalRegistration)}</p1:InscricaoMunicipal>` : ''
    }</p1:IdentificacaoTomador>`
    : '';

  const address = taker.address
    ? '<p1:Endereco>'
      + `<p1:Endereco>${escapeXml(taker.address.street)}</p1:Endereco>`
      + `<p1:Numero>${escapeXml(taker.address.number)}</p1:Numero>`
      + (taker.address.complement ? `<p1:Complemento>${escapeXml(taker.address.complement)}</p1:Complemento>` : '')
      + `<p1:Bairro>${escapeXml(taker.address.neighborhood)}</p1:Bairro>`
      + `<p1:CodigoMunicipio>${taker.address.cityCodeIbge}</p1:CodigoMunicipio>`
      + `<p1:Uf>${taker.address.state}</p1:Uf>`
      + `<p1:Cep>${taker.address.zipCode}</p1:Cep>`
      + '</p1:Endereco>'
    : '';

  const contact = taker.email
    ? `<p1:Contato><p1:Email>${escapeXml(taker.email)}</p1:Email></p1:Contato>`
    : (taker.phone ? `<p1:Contato><p1:Telefone>${escapeXml(taker.phone)}</p1:Telefone></p1:Contato>` : '');

  return `<p1:TomadorServico>${identification}<p1:RazaoSocial>${escapeXml(taker.companyName)}</p1:RazaoSocial>${address}${contact}</p1:TomadorServico>`;
}

function buildService(rps: NfsRpsDto): string {
  const s = rps.service;

  const valores = '<p1:Valores>'
    + `<p1:ValorServicos>${s.servicesValue.toFixed(2)}</p1:ValorServicos>`
    + (s.deductionsValue !== undefined ? `<p1:ValorDeducoes>${s.deductionsValue.toFixed(2)}</p1:ValorDeducoes>` : '')
    + (s.inssValue !== undefined ? `<p1:ValorInss>${s.inssValue.toFixed(2)}</p1:ValorInss>` : '')
    + (s.irValue !== undefined ? `<p1:ValorIr>${s.irValue.toFixed(2)}</p1:ValorIr>` : '')
    + (s.csllValue !== undefined ? `<p1:ValorCsll>${s.csllValue.toFixed(2)}</p1:ValorCsll>` : '')
    + (s.otherWithholdingsValue !== undefined ? `<p1:OutrasRetencoes>${s.otherWithholdingsValue.toFixed(2)}</p1:OutrasRetencoes>` : '')
    + (s.issValue !== undefined ? `<p1:ValorIss>${s.issValue.toFixed(2)}</p1:ValorIss>` : '')
    + (s.issRate !== undefined ? `<p1:Aliquota>${s.issRate.toFixed(4)}</p1:Aliquota>` : '')
    + (s.unconditionalDiscount !== undefined ? `<p1:DescontoIncondicionado>${s.unconditionalDiscount.toFixed(2)}</p1:DescontoIncondicionado>` : '')
    + (s.conditionalDiscount !== undefined ? `<p1:DescontoCondicionado>${s.conditionalDiscount.toFixed(2)}</p1:DescontoCondicionado>` : '')
    + '</p1:Valores>';

  return `<p1:Servico>${valores}`
    + `<p1:IssRetido>${yesNo(s.issWithheld)}</p1:IssRetido>`
    + `<p1:ItemListaServico>${escapeXml(s.serviceListItemCode)}</p1:ItemListaServico>`
    + (s.cnaeCode ? `<p1:CodigoCnae>${s.cnaeCode}</p1:CodigoCnae>` : '')
    + (s.municipalTaxCode ? `<p1:CodigoTributacaoMunicipio>${escapeXml(s.municipalTaxCode)}</p1:CodigoTributacaoMunicipio>` : '')
    + `<p1:CodigoNbs>${s.nbsCode}</p1:CodigoNbs>`
    + `<p1:Discriminacao>${escapeXml(s.description)}</p1:Discriminacao>`
    + `<p1:CodigoMunicipio>${s.serviceMunicipalCodeIbge}</p1:CodigoMunicipio>`
    // CodigoPais é opcional no XSD (tsCodigoPaisIbge) mas o Giss rejeita em runtime sem ele (E383).
    // "1058" é o código IBGE/BACEN padrão do Brasil — assume-se serviço prestado no Brasil (v1 não
    // cobre prestação de serviço no exterior).
    + '<p1:CodigoPais>1058</p1:CodigoPais>'
    + `<p1:ExigibilidadeISS>${s.issExigibility}</p1:ExigibilidadeISS>`
    // MunicipioIncidencia é opcional no XSD, mas o Giss rejeita em runtime sem ele (E310 "Código do
    // município de incidência do ISSQN incorreto"). Sem regra de transferência de incidência informada,
    // assume-se que o ISS incide no mesmo município onde o serviço foi prestado.
    + `<p1:MunicipioIncidencia>${s.serviceMunicipalCodeIbge}</p1:MunicipioIncidencia>`
    + '</p1:Servico>';
}

function buildRps(rps: NfsRpsDto, index: number): string {
  const infId = `rps${index}`;

  const infDeclaracao = `<p1:InfDeclaracaoPrestacaoServico Id="${infId}">`
    + '<p1:Rps>'
    + '<p1:IdentificacaoRps>'
    + `<p1:Numero>${rps.rpsNumber}</p1:Numero>`
    + `<p1:Serie>${escapeXml(rps.rpsSeries)}</p1:Serie>`
    + `<p1:Tipo>${rps.rpsType}</p1:Tipo>`
    + '</p1:IdentificacaoRps>'
    + `<p1:DataEmissao>${rps.issueDate}</p1:DataEmissao>`
    + '<p1:Status>1</p1:Status>'
    + '</p1:Rps>'
    + `<p1:Competencia>${rps.competence}</p1:Competencia>`
    + buildService(rps)
    + buildProvider(rps.provider)
    + buildTaker(rps.taker)
    + `<p1:OptanteSimplesNacional>${yesNo(rps.simpleNationalOptant)}</p1:OptanteSimplesNacional>`
    + `<p1:IncentivoFiscal>${yesNo(rps.fiscalIncentive)}</p1:IncentivoFiscal>`
    + (rps.additionalInformation ? `<p1:InformacoesComplementares>${escapeXml(rps.additionalInformation)}</p1:InformacoesComplementares>` : '')
    + '</p1:InfDeclaracaoPrestacaoServico>';

  return `<p1:Rps>${infDeclaracao}</p1:Rps>`;
}

/**
 * Monta o XML (não assinado) de `EnviarLoteRpsEnvio`. A assinatura é aplicada depois, por cima deste XML,
 * via `signGissElementById`: cada RPS individualmente (referenciado pelo próprio `Id`), e o lote inteiro
 * por último (referenciado pelo `Id` do `LoteRps`) — validado ao vivo contra produção (protocolo real
 * aceito com esse padrão; a variante sem `Id`/URI vazia no lote regrediu para erro síncrono E173, então
 * foi revertida).
 *
 * Namespaces: `EnviarLoteRpsEnvio`/`LoteRps` (prefixo `p`) pertencem ao schema `enviar-lote-rps-envio-v2_04.xsd`;
 * todos os tipos de negócio aninhados (Prestador, Servico, RPS, etc., prefixo `p1`) pertencem a `tipos-v2_04.xsd`
 * — são dois namespaces distintos, confirmado nos XSDs reais e no exemplo oficial
 * (`gissonline_docs/Exemplo_XML-Servicos_Prestados_20260420.rar`).
 */
export function buildGissIssueBatchXml(input: IssueNfsBatchInputDto): { xml: string; loteId: string; rpsIds: string[] } {
  if (input.rpsList.length === 0) {
    throw new Error('Lote de RPS não pode ser vazio');
  }
  if (input.rpsList.length > 50) {
    throw new Error('Lote de RPS não pode ter mais de 50 RPS');
  }

  const loteId = `lote${input.batchNumber}`;
  const provider = input.rpsList[0].provider;
  const rpsIds = input.rpsList.map((_, index) => `rps${index + 1}`);

  const listaRps = input.rpsList.map((rps, index) => buildRps(rps, index + 1)).join('');

  const loteRps = `<p:LoteRps Id="${loteId}" versao="${LEIAUTE_VERSION}">`
    + `<p1:NumeroLote>${input.batchNumber}</p1:NumeroLote>`
    + buildProvider(provider)
    + `<p1:QuantidadeRps>${input.rpsList.length}</p1:QuantidadeRps>`
    + `<p1:ListaRps>${listaRps}</p1:ListaRps>`
    + '</p:LoteRps>';

  const xml = `<p:EnviarLoteRpsEnvio xmlns:p="${GISS_ENVIAR_LOTE_RPS_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">${loteRps}</p:EnviarLoteRpsEnvio>`;

  return { xml, loteId, rpsIds };
}

export function parseGissRecepcionarLoteRpsResponse(xml: string): IssueNfsBatchOutputDto {
  const parsed = responseParser.parse(xml);
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
