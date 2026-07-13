import { DecimalMoney } from 'src/shared/value-objects/decimal-money/decimal-money.vo';
import { Document } from 'src/shared/value-objects/document/document.vo';
import { ZipCode } from 'src/shared/value-objects/zip-code/zip-code.vo';
import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { IssueNfItemDto } from '../../../dtos/issue-nf/issue-nf-item.dto';
import { IssueNfPartyDto } from '../../../dtos/issue-nf/issue-nf-party.dto';
import { NfPartyType } from '../../../enums/nf-party-type.enum';
import { NfRate } from '../value-objects/nf-rate/nf-rate.vo';
import { NfSanitizedText } from '../value-objects/nf-sanitized-text/nf-sanitized-text.vo';

function formatRpsDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function xmlTag(tag: string, value: string | number): string {
  const normalizedValue = new NfSanitizedText(String(value)).value;

  return `<${tag}>${normalizedValue}</${tag}>`;
}

function xmlTagRaw(tag: string, value: string | number): string {
  return `<${tag}>${value}</${tag}>`;
}

function buildPartyDocumentXml(party: IssueNfPartyDto): string {
  const document = new Document(party.document).value;

  if (party.type === NfPartyType.PF) {
    return xmlTagRaw('Cpf', document);
  }

  return xmlTagRaw('Cnpj', document);
}

function computeServiceValue(items: IssueNfItemDto[]): number {
  return items.reduce((total, item) => total + (item.quantity * item.unitValueInCents) / 100, 0);
}

function buildDiscriminacao(items: IssueNfItemDto[]): string {
  return items
    .map((item) => new NfSanitizedText(item.description).value)
    .filter(Boolean)
    .join(' | ');
}

function resolveSimpleNationalOptant(input: IssueNfInputDto): number {
  if (input.fiscal.simpleNationalOptant != null) {
    return input.fiscal.simpleNationalOptant;
  }

  const crt = input.emitter.crt;
  if (crt === 1 || crt === 2) {
    return 1;
  }

  return 2;
}

function buildInformacoesComplementares(input: IssueNfInputDto): string | null {
  const parts = [
    input.orderNumber?.trim() ? `Pedido: ${input.orderNumber.trim()}` : null,
    input.fiscal.orderReference?.trim() && input.fiscal.orderReference.trim() !== input.orderNumber?.trim()
      ? `Referencia: ${input.fiscal.orderReference.trim()}`
      : null,
    input.fiscal.additionalInfo?.trim(),
  ].filter(Boolean);

  if (!parts.length) {
    return null;
  }

  return parts.join(' | ');
}

function buildTomadorEndereco(party: IssueNfPartyDto): string {
  const address = party.address;

  return [
    '<Endereco>',
    xmlTag('Endereco', address.street),
    xmlTag('Numero', address.number),
    address.complement ? xmlTag('Complemento', address.complement) : '',
    xmlTag('Bairro', address.neighborhood),
    xmlTagRaw('CodigoMunicipio', address.cityCode),
    xmlTag('Uf', address.state),
    xmlTagRaw('Cep', new ZipCode(address.zipCode).value),
    '</Endereco>',
  ].join('');
}

function buildTomadorContato(party: IssueNfPartyDto): string {
  if (!party.phone?.trim() && !party.email?.trim()) {
    return '';
  }

  return [
    '<Contato>',
    party.phone?.trim() ? xmlTag('Telefone', party.phone.trim()) : '',
    party.email?.trim() ? xmlTag('Email', party.email.trim()) : '',
    '</Contato>',
  ].join('');
}

export function buildNfemailIssueRpsXml(input: IssueNfInputDto): string {
  const primaryItem = input.items[0];
  const serviceValue = computeServiceValue(input.items);
  const issRate = input.fiscal.issRate ?? 0;
  const issValue = serviceValue * issRate / 100;
  const emissionDate = formatRpsDate();
  const rpsNumber = input.fiscal.nfeNumber ?? 1;
  const serviceCityCode = primaryItem.taxation.indopCode === '4'
    ? '9999999'
    : input.emitter.address.cityCode;

  const identificacaoRps = [
    xmlTagRaw('Numero', rpsNumber),
    xmlTagRaw('Serie', input.fiscal.series),
    xmlTagRaw('Tipo', 1),
  ].join('');

  const valores = [
    xmlTagRaw('ValorServicos', DecimalMoney.fromDecimal(serviceValue).value),
    xmlTagRaw('ValorDeducoes', '0.00'),
    xmlTagRaw('ValorPis', '0.00'),
    xmlTagRaw('ValorCofins', '0.00'),
    xmlTagRaw('ValorInss', '0.00'),
    xmlTagRaw('ValorIr', '0.00'),
    xmlTagRaw('ValorCsll', '0.00'),
    xmlTagRaw('OutrasRetencoes', '0.00'),
    xmlTagRaw('ValorIss', DecimalMoney.fromDecimal(issValue).value),
    xmlTagRaw('Aliquota', NfRate.fromDecimal(issRate).value),
    xmlTagRaw('DescontoIncondicionado', '0.00'),
    xmlTagRaw('DescontoCondicionado', '0.00'),
  ].join('');

  const servico = [
    `<Valores>${valores}</Valores>`,
    xmlTagRaw('IssRetido', input.fiscal.issWithheld ?? 2),
    xmlTagRaw('ItemListaServico', primaryItem.taxation.serviceListItem!),
    xmlTagRaw('CodigoCnae', primaryItem.taxation.cnaeCode.replace(/\D/g, '')),
    input.fiscal.municipalTaxCode?.trim()
      ? xmlTag('CodigoTributacaoMunicipio', input.fiscal.municipalTaxCode.trim())
      : '',
    xmlTagRaw('CodigoNbs', primaryItem.taxation.nbsCode.replace(/\D/g, '')),
    xmlTag('Discriminacao', buildDiscriminacao(input.items)),
    xmlTagRaw('CodigoMunicipio', serviceCityCode),
    xmlTagRaw('ExigibilidadeISS', input.fiscal.issExigibility ?? 1),
    xmlTagRaw('MunicipioIncidencia', input.emitter.address.cityCode),
  ].join('');

  const prestador = [
    '<CpfCnpj>',
    buildPartyDocumentXml(input.emitter),
    '</CpfCnpj>',
    xmlTag('InscricaoMunicipal', input.emitter.municipalRegistration!),
  ].join('');

  const tomadorIdentificacao = [
    '<CpfCnpj>',
    buildPartyDocumentXml(input.recipient),
    '</CpfCnpj>',
    input.recipient.municipalRegistration?.trim()
      ? xmlTag('InscricaoMunicipal', input.recipient.municipalRegistration.trim())
      : '',
  ].join('');

  const tomador = [
    `<IdentificacaoTomador>${tomadorIdentificacao}</IdentificacaoTomador>`,
    xmlTag('RazaoSocial', input.recipient.companyName),
    buildTomadorEndereco(input.recipient),
    buildTomadorContato(input.recipient),
  ].join('');

  const informacoesComplementares = buildInformacoesComplementares(input);

  const infDeclaracao = [
    `<Rps><IdentificacaoRps>${identificacaoRps}</IdentificacaoRps>${xmlTagRaw('DataEmissao', emissionDate)}${xmlTagRaw('Status', 1)}</Rps>`,
    xmlTagRaw('Competencia', emissionDate),
    `<Servico>${servico}</Servico>`,
    `<Prestador>${prestador}</Prestador>`,
    `<TomadorServico>${tomador}</TomadorServico>`,
    xmlTagRaw('OptanteSimplesNacional', resolveSimpleNationalOptant(input)),
    xmlTagRaw('IncentivoFiscal', input.fiscal.fiscalIncentive ?? 2),
    informacoesComplementares ? xmlTag('InformacoesComplementares', informacoesComplementares) : '',
  ].join('');

  return `<Rps xmlns="http://www.abrasf.org.br/nfse.xsd"><InfDeclaracaoPrestacaoServico>${infDeclaracao}</InfDeclaracaoPrestacaoServico></Rps>`;
}
