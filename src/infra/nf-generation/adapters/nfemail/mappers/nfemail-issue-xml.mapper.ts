import { DecimalMoney } from 'src/shared/value-objects/decimal-money/decimal-money.vo';
import { DecimalQuantity } from 'src/shared/value-objects/decimal-quantity/decimal-quantity.vo';
import { Document } from 'src/shared/value-objects/document/document.vo';
import { ZipCode } from 'src/shared/value-objects/zip-code/zip-code.vo';
import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { IssueNfItemDto } from '../../../dtos/issue-nf/issue-nf-item.dto';
import { IssueNfPartyDto } from '../../../dtos/issue-nf/issue-nf-party.dto';
import { NfPartyType } from '../../../enums/nf-party-type.enum';
import { NfRate } from '../value-objects/nf-rate/nf-rate.vo';
import { NfSanitizedText } from '../value-objects/nf-sanitized-text/nf-sanitized-text.vo';
import { resolveIssueNfTotals } from './nfemail-issue-totals.calculator';

function extractStateCode(cityCode: string): string {
  return cityCode.slice(0, 2);
}

function formatEmissionDateTime(date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const minutes = String(absoluteOffset % 60).padStart(2, '0');
  const iso = date.toISOString().slice(0, 19);

  return `${iso}${sign}${hours}:${minutes}`;
}

function xmlTag(tag: string, value: string | number, attributes?: Record<string, string>): string {
  const attrs = attributes
    ? ` ${Object.entries(attributes).map(([key, attrValue]) => `${key}="${attrValue}"`).join(' ')}`
    : '';
  const normalizedValue = new NfSanitizedText(String(value)).value;

  return `<${tag}${attrs}>${normalizedValue}</${tag}>`;
}

function xmlTagRaw(tag: string, value: string | number, attributes?: Record<string, string>): string {
  const attrs = attributes
    ? ` ${Object.entries(attributes).map(([key, attrValue]) => `${key}="${attrValue}"`).join(' ')}`
    : '';

  return `<${tag}${attrs}>${value}</${tag}>`;
}

function buildAddressXml(prefix: string, party: IssueNfPartyDto): string {
  const address = party.address;
  const countryCode = address.countryCode ?? '1058';

  return [
    xmlTag(`${prefix}xLgr`, address.street),
    xmlTag(`${prefix}nro`, address.number),
    address.complement ? xmlTag(`${prefix}xCpl`, address.complement) : '',
    xmlTag(`${prefix}xBairro`, address.neighborhood),
    xmlTagRaw(`${prefix}cMun`, address.cityCode),
    xmlTag(`${prefix}xMun`, address.city),
    xmlTag(`${prefix}UF`, address.state),
    xmlTagRaw(`${prefix}CEP`, new ZipCode(address.zipCode).value),
    xmlTagRaw(`${prefix}cPais`, countryCode),
    xmlTag(`${prefix}xPais`, 'BRASIL'),
  ].join('');
}

function buildPartyDocumentXml(tag: string, party: IssueNfPartyDto): string {
  const document = new Document(party.document).value;
  return xmlTagRaw(tag, document);
}

function buildItemXml(item: IssueNfItemDto, index: number): string {
  const productValue = DecimalMoney.fromDecimal((item.quantity * item.unitValueInCents) / 100).value;
  const unitValue = DecimalMoney.fromCents(item.unitValueInCents).value;

  const prod = [
    xmlTagRaw('cProd', index),
    xmlTag('cEAN', 'SEM GTIN'),
    xmlTag('xProd', item.description),
    xmlTagRaw('NCM', item.fiscal.ncm),
    xmlTagRaw('CFOP', item.fiscal.cfop),
    xmlTag('uCom', 'UN'),
    xmlTagRaw('qCom', DecimalQuantity.fromDecimal(item.quantity).value),
    xmlTagRaw('vUnCom', unitValue),
    xmlTagRaw('vProd', productValue),
    xmlTag('cEANTrib', 'SEM GTIN'),
    xmlTag('uTrib', 'UN'),
    xmlTagRaw('qTrib', DecimalQuantity.fromDecimal(item.quantity).value),
    xmlTagRaw('vUnTrib', unitValue),
    xmlTagRaw('indTot', 1),
  ].join('');

  const imposto = [
    '<ICMS>',
    '<ICMS00>',
    xmlTagRaw('orig', item.fiscal.origin),
    xmlTagRaw('CST', item.fiscal.cstIcms),
    xmlTagRaw('modBC', 3),
    xmlTagRaw('vBC', DecimalMoney.fromDecimal(item.fiscal.icmsBase).value),
    xmlTagRaw('pICMS', NfRate.fromDecimal(item.fiscal.icmsRate).value),
    xmlTagRaw('vICMS', DecimalMoney.fromDecimal(item.fiscal.icmsValue).value),
    '</ICMS00>',
    '</ICMS>',
    '<PIS>',
    '<PISOutr>',
    xmlTagRaw('CST', item.fiscal.cstPis),
    xmlTagRaw('vBC', '0.00'),
    xmlTagRaw('pPIS', '0.00'),
    xmlTagRaw('vPIS', '0.00'),
    '</PISOutr>',
    '</PIS>',
    '<COFINS>',
    '<COFINSOutr>',
    xmlTagRaw('CST', item.fiscal.cstCofins),
    xmlTagRaw('vBC', '0.00'),
    xmlTagRaw('pCOFINS', '0.00'),
    xmlTagRaw('vCOFINS', '0.00'),
    '</COFINSOutr>',
    '</COFINS>',
    '<IBSCBS>',
    xmlTagRaw('CST', item.ibsCbs.cst),
    xmlTagRaw('cClassTrib', item.ibsCbs.cClassTrib),
    '<gIBSCBS>',
    xmlTagRaw('vBC', DecimalMoney.fromDecimal(item.ibsCbs.baseValue).value),
    '<gIBSUF>',
    xmlTagRaw('pIBSUF', NfRate.fromDecimal(item.ibsCbs.ibsStateRate).value),
    xmlTagRaw('vIBSUF', DecimalMoney.fromDecimal(item.ibsCbs.ibsStateValue).value),
    '</gIBSUF>',
    '<gIBSMun>',
    xmlTagRaw('pIBSMun', NfRate.fromDecimal(item.ibsCbs.ibsCityRate).value),
    xmlTagRaw('vIBSMun', DecimalMoney.fromDecimal(item.ibsCbs.ibsCityValue).value),
    '</gIBSMun>',
    xmlTagRaw('vIBS', DecimalMoney.fromDecimal(item.ibsCbs.ibsTotalValue).value),
    '<gCBS>',
    xmlTagRaw('pCBS', NfRate.fromDecimal(item.ibsCbs.cbsRate).value),
    xmlTagRaw('vCBS', DecimalMoney.fromDecimal(item.ibsCbs.cbsValue).value),
    '</gCBS>',
    '</gIBSCBS>',
    '</IBSCBS>',
  ].join('');

  return `<det nItem="${index}"><prod>${prod}</prod><imposto>${imposto}</imposto>${xmlTagRaw('vItem', DecimalMoney.fromDecimal(item.ibsCbs.itemTotalValue).value)}</det>`;
}

export function buildNfemailIssueXml(input: IssueNfInputDto): string {
  const totals = resolveIssueNfTotals(input);
  const emitterCityCode = input.emitter.address.cityCode;
  const stateCode = extractStateCode(emitterCityCode);
  const emissionDateTime = formatEmissionDateTime();
  const nfeNumber = input.fiscal.nfeNumber ?? 1;
  const controlNumber = String(nfeNumber).padStart(8, '0').slice(-8);
  const emitterDocument = new Document(input.emitter.document).value;
  const infNFeId = `NFe${stateCode}${emissionDateTime.slice(2, 4)}${emissionDateTime.slice(5, 7)}${emitterDocument}5501${String(input.fiscal.series).padStart(3, '0')}${String(nfeNumber).padStart(9, '0')}`.slice(0, 47);

  const ide = [
    xmlTagRaw('cUF', stateCode),
    xmlTagRaw('cNF', controlNumber),
    xmlTag('natOp', input.fiscal.naturezaOperacao),
    xmlTagRaw('mod', 55),
    xmlTagRaw('serie', input.fiscal.series),
    xmlTagRaw('nNF', nfeNumber),
    xmlTagRaw('dhEmi', emissionDateTime),
    xmlTagRaw('tpNF', input.fiscal.operationType),
    xmlTagRaw('idDest', 1),
    xmlTagRaw('cMunFG', emitterCityCode),
    xmlTagRaw('tpImp', 1),
    xmlTagRaw('tpEmis', 1),
    xmlTagRaw('cDV', 1),
    xmlTagRaw('tpAmb', input.fiscal.environment),
    xmlTagRaw('finNFe', input.fiscal.finalidade),
    xmlTagRaw('indFinal', 0),
    xmlTagRaw('indPres', input.fiscal.presenceIndicator),
    xmlTagRaw('indIntermed', input.fiscal.intermediaryIndicator),
    xmlTagRaw('procEmi', 0),
    xmlTag('verProc', 'dpasis_api 1.0.0'),
  ].join('');

  const emit = [
    buildPartyDocumentXml('CNPJ', input.emitter),
    xmlTag('xNome', input.emitter.companyName),
    input.emitter.fantasyName ? xmlTag('xFant', input.emitter.fantasyName) : '',
    `<enderEmit>${buildAddressXml('', input.emitter)}</enderEmit>`,
    input.emitter.ie ? xmlTag('IE', input.emitter.ie) : '',
    xmlTagRaw('CRT', input.emitter.crt ?? 3),
  ].join('');

  const destDocumentTag = input.recipient.type === NfPartyType.PF ? 'CPF' : 'CNPJ';
  const dest = [
    buildPartyDocumentXml(destDocumentTag, input.recipient),
    xmlTag('xNome', input.recipient.companyName),
    `<enderDest>${buildAddressXml('', input.recipient)}</enderDest>`,
    xmlTagRaw('indIEDest', input.recipient.ie ? 1 : 2),
  ].join('');

  const det = input.items.map((item, index) => buildItemXml(item, index + 1)).join('');

  const icmsTot = [
    xmlTagRaw('vBC', DecimalMoney.fromDecimal(totals.icmsBase).value),
    xmlTagRaw('vICMS', DecimalMoney.fromDecimal(totals.icmsValue).value),
    xmlTagRaw('vICMSDeson', '0.00'),
    xmlTagRaw('vFCP', '0.00'),
    xmlTagRaw('vBCST', '0.00'),
    xmlTagRaw('vST', '0.00'),
    xmlTagRaw('vFCPST', '0.00'),
    xmlTagRaw('vFCPSTRet', '0.00'),
    xmlTagRaw('vProd', DecimalMoney.fromDecimal(totals.productValue).value),
    xmlTagRaw('vFrete', '0.00'),
    xmlTagRaw('vSeg', '0.00'),
    xmlTagRaw('vDesc', '0.00'),
    xmlTagRaw('vII', '0.00'),
    xmlTagRaw('vIPI', '0.00'),
    xmlTagRaw('vIPIDevol', '0.00'),
    xmlTagRaw('vPIS', '0.00'),
    xmlTagRaw('vCOFINS', '0.00'),
    xmlTagRaw('vOutro', '0.00'),
    xmlTagRaw('vNF', DecimalMoney.fromDecimal(totals.nfValue).value),
  ].join('');

  const ibsCbsTot = [
    xmlTagRaw('vBCIBSCBS', DecimalMoney.fromDecimal(totals.ibsCbs.baseValue).value),
    '<gIBS>',
    '<gIBSUF>',
    xmlTagRaw('vDif', DecimalMoney.fromDecimal(totals.ibsCbs.ibsStateDiff).value),
    xmlTagRaw('vDevTrib', DecimalMoney.fromDecimal(totals.ibsCbs.ibsStateDevTrib).value),
    xmlTagRaw('vIBSUF', DecimalMoney.fromDecimal(totals.ibsCbs.ibsStateValue).value),
    '</gIBSUF>',
    '<gIBSMun>',
    xmlTagRaw('vDif', DecimalMoney.fromDecimal(totals.ibsCbs.ibsCityDiff).value),
    xmlTagRaw('vDevTrib', DecimalMoney.fromDecimal(totals.ibsCbs.ibsCityDevTrib).value),
    xmlTagRaw('vIBSMun', DecimalMoney.fromDecimal(totals.ibsCbs.ibsCityValue).value),
    '</gIBSMun>',
    xmlTagRaw('vIBS', DecimalMoney.fromDecimal(totals.ibsCbs.ibsTotalValue).value),
    xmlTagRaw('vCredPres', DecimalMoney.fromDecimal(totals.ibsCbs.ibsCredPres).value),
    xmlTagRaw('vCredPresCondSus', DecimalMoney.fromDecimal(totals.ibsCbs.ibsCredPresCondSus).value),
    '</gIBS>',
    '<gCBS>',
    xmlTagRaw('vDif', DecimalMoney.fromDecimal(totals.ibsCbs.cbsDiff).value),
    xmlTagRaw('vDevTrib', DecimalMoney.fromDecimal(totals.ibsCbs.cbsDevTrib).value),
    xmlTagRaw('vCBS', DecimalMoney.fromDecimal(totals.ibsCbs.cbsValue).value),
    xmlTagRaw('vCredPres', DecimalMoney.fromDecimal(totals.ibsCbs.cbsCredPres).value),
    xmlTagRaw('vCredPresCondSus', DecimalMoney.fromDecimal(totals.ibsCbs.cbsCredPresCondSus).value),
    '</gCBS>',
  ].join('');

  const total = [
    `<ICMSTot>${icmsTot}</ICMSTot>`,
    `<IBSCBSTot>${ibsCbsTot}</IBSCBSTot>`,
    xmlTagRaw('vNFTot', DecimalMoney.fromDecimal(totals.ibsCbs.nfTotalValue).value),
  ].join('');

  const transp = xmlTagRaw('modFrete', input.fiscal.freightMode);
  const pag = `<detPag>${xmlTagRaw('tPag', input.fiscal.paymentMethod)}${xmlTagRaw('vPag', DecimalMoney.fromDecimal(input.fiscal.paymentValue || totals.nfValue).value)}</detPag>`;

  const infAdic = input.fiscal.additionalInfo
    ? `<infAdic>${xmlTag('infCpl', input.fiscal.additionalInfo)}</infAdic>`
    : input.orderNumber
      ? `<infAdic><obsCont xCampo="pedido">${xmlTag('xTexto', input.orderNumber)}</obsCont></infAdic>`
      : '';

  const infNFe = [
    `<ide>${ide}</ide>`,
    `<emit>${emit}</emit>`,
    `<dest>${dest}</dest>`,
    det,
    `<total>${total}</total>`,
    `<transp>${transp}</transp>`,
    `<pag>${pag}</pag>`,
    infAdic,
  ].join('');

  return `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="${infNFeId}" versao="4.00">${infNFe}</infNFe></NFe>`;
}
