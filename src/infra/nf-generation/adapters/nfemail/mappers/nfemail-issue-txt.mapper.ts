import { DecimalMoney } from 'src/shared/value-objects/decimal-money/decimal-money.vo';
import { DecimalQuantity } from 'src/shared/value-objects/decimal-quantity/decimal-quantity.vo';
import { Document } from 'src/shared/value-objects/document/document.vo';
import { ZipCode } from 'src/shared/value-objects/zip-code/zip-code.vo';
import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { IssueNfItemDto } from '../../../dtos/issue-nf/issue-nf-item.dto';
import { IssueNfPartyDto } from '../../../dtos/issue-nf/issue-nf-party.dto';
import { NfPartyType } from '../../../enums/nf-party-type.enum';
import { NfPipeLine } from '../value-objects/nf-pipe-line/nf-pipe-line.vo';
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

function buildAddressLine(
  prefix: string,
  party: IssueNfPartyDto,
): string {
  const address = party.address;
  const countryCode = address.countryCode ?? '1058';

  return NfPipeLine.create(
    prefix,
    new NfSanitizedText(address.street).value,
    new NfSanitizedText(address.number).value,
    new NfSanitizedText(address.complement ?? '').value,
    new NfSanitizedText(address.neighborhood).value,
    address.cityCode,
    new NfSanitizedText(address.city).value,
    address.state,
    new ZipCode(address.zipCode).value,
    countryCode,
    'BRASIL',
    new NfSanitizedText(party.phone ?? '').value,
  ).value;
}

function buildPartyDocumentLine(prefix: string, party: IssueNfPartyDto): string {
  const document = new Document(party.document).value;
  return NfPipeLine.create(prefix, document).value;
}

function buildItemLines(item: IssueNfItemDto, index: number): string {
  const productValue = DecimalMoney.fromDecimal((item.quantity * item.unitValueInCents) / 100).value;
  const unitValue = DecimalMoney.fromCents(item.unitValueInCents, 10).value;

  let content = '';
  content += NfPipeLine.create('H', index, '').value;
  content += NfPipeLine.create(
    'I',
    index,
    '',
    new NfSanitizedText(item.description).value,
    item.fiscal.ncm,
    '',
    item.fiscal.cfop,
    'UN',
    DecimalQuantity.fromDecimal(item.quantity).value,
    unitValue,
    productValue,
    '',
    'UN',
    DecimalQuantity.fromDecimal(item.quantity).value,
    unitValue,
    '',
    '',
    '',
    '',
    '1',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ).value;
  content += NfPipeLine.create('M', '').value;
  content += NfPipeLine.createGroupOnly('N').value;
  content += NfPipeLine.create('N10d', item.fiscal.origin, item.fiscal.cstIcms).value;
  content += NfPipeLine.createGroupOnly('Q').value;
  content += NfPipeLine.create('Q04', item.fiscal.cstPis).value;
  content += NfPipeLine.createGroupOnly('S').value;
  content += NfPipeLine.create('S04', item.fiscal.cstCofins).value;
  content += NfPipeLine.createGroupOnly('UB').value;
  content += NfPipeLine.create(
    'UB12',
    item.ibsCbs.cst,
    item.ibsCbs.cClassTrib,
    '',
    DecimalMoney.fromDecimal(item.ibsCbs.baseValue).value,
  ).value;
  content += NfPipeLine.create(
    'UB15',
    DecimalMoney.fromDecimal(item.ibsCbs.baseValue).value,
    DecimalMoney.fromDecimal(item.ibsCbs.ibsTotalValue).value,
  ).value;
  content += NfPipeLine.create(
    'UB17',
    NfRate.fromDecimal(item.ibsCbs.ibsStateRate).value,
    DecimalMoney.fromDecimal(item.ibsCbs.ibsStateValue).value,
  ).value;
  content += NfPipeLine.create(
    'UB36',
    NfRate.fromDecimal(item.ibsCbs.ibsCityRate).value,
    DecimalMoney.fromDecimal(item.ibsCbs.ibsCityValue).value,
  ).value;
  content += NfPipeLine.create(
    'UB55',
    NfRate.fromDecimal(item.ibsCbs.cbsRate).value,
    DecimalMoney.fromDecimal(item.ibsCbs.cbsValue).value,
  ).value;
  content += NfPipeLine.create('VB01', DecimalMoney.fromDecimal(item.ibsCbs.itemTotalValue).value).value;

  return content;
}

export function buildNfemailIssueTxt(input: IssueNfInputDto): string {
  const totals = resolveIssueNfTotals(input);
  const emitterCityCode = input.emitter.address.cityCode;
  const stateCode = extractStateCode(emitterCityCode);
  const emissionDateTime = formatEmissionDateTime();
  const nfeNumber = input.fiscal.nfeNumber ?? 1;
  const controlNumber = String(nfeNumber).padStart(8, '0').slice(-8);

  let content = '';
  content += NfPipeLine.createGroupOnly('NOTAFISCAL|1', false).value;
  content += NfPipeLine.create('A', '4.00', '').value;
  content += NfPipeLine.create(
    'B',
    stateCode, // cUF
    controlNumber, // cNF
    new NfSanitizedText(input.fiscal.naturezaOperacao).value, // natOp
    '55', // mod
    input.fiscal.series, // serie
    nfeNumber, // nNF
    emissionDateTime, // dhEmi
    '', // dhSaiEnt
    input.fiscal.operationType, // tpNF
    '1', // idDest (1=operação interna)
    emitterCityCode, // cMunFG
    '1', // tpImp (1=retrato DANFE)
    '1', // tpEmis (1=emissão normal)
    '', // cDV (NFeMail calcula ao transmitir)
    input.fiscal.environment, // tpAmb (1=produção, 2=homologação)
    input.fiscal.finalidade, // finNFe
    '0', // indFinal (0=não consumidor final)
    input.fiscal.presenceIndicator, // indPres
    '0', // procEmi (0=software do contribuinte)
    '4.00_b012', // verProc
    '', // dhCont
    '', // xJust
  ).value;
  content += NfPipeLine.create('B25c', input.fiscal.intermediaryIndicator).value;

  content += NfPipeLine.create(
    'C',
    new NfSanitizedText(input.emitter.fantasyName ?? input.emitter.companyName).value,
    '',
    new NfSanitizedText(input.emitter.ie ?? '').value,
    '',
    '',
    '',
    input.emitter.crt ?? 3,
  ).value;
  content += buildPartyDocumentLine('C02', input.emitter);
  content += buildAddressLine('C05', input.emitter);

  content += NfPipeLine.create(
    'E',
    new NfSanitizedText(input.recipient.companyName).value,
    input.recipient.ie ? '1' : '9',
    '',
    '',
    '',
    '',
  ).value;
  content += buildPartyDocumentLine(
    input.recipient.type === NfPartyType.PF ? 'E03' : 'E02',
    input.recipient,
  );
  content += buildAddressLine('E05', input.recipient);

  for (const [index, item] of input.items.entries()) {
    content += buildItemLines(item, index + 1);
  }

  content += NfPipeLine.createGroupOnly('W').value;
  content += NfPipeLine.create(
    'W02',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    DecimalMoney.fromDecimal(totals.productValue).value,
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    '0.00',
    DecimalMoney.fromDecimal(totals.nfValue).value,
    '0.00',
  ).value;
  // W04c/W04e/W04g = ICMS interestadual (vFCPUFDest / vICMSUFDest / vICMSUFRemet) — zero para operações internas
  content += NfPipeLine.create('W04c', '0.00').value;
  content += NfPipeLine.create('W04e', '0.00').value;
  content += NfPipeLine.create('W04g', '0.00').value;
  // Reforma Tributária — IBS/CBS (NT 2025.002, layout TXT NFeMail v5.2025)
  content += NfPipeLine.create('W34', DecimalMoney.fromDecimal(totals.ibsCbs.baseValue).value).value;
  content += NfPipeLine.create(
    'W36',
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsTotalValue).value, // vIBS
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsCredPres).value, // vCredPres
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsCredPresCondSus).value, // vCredPresCondSus
  ).value;
  content += NfPipeLine.create(
    'W37',
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsStateDiff).value, // vDif UF
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsStateDevTrib).value, // vDevTrib UF
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsStateValue).value, // vIBSUF
  ).value;
  content += NfPipeLine.create(
    'W42',
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsCityDiff).value, // vDif Mun
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsCityDevTrib).value, // vDevTrib Mun
    DecimalMoney.fromDecimal(totals.ibsCbs.ibsCityValue).value, // vIBSMun
  ).value;
  content += NfPipeLine.create(
    'W50',
    DecimalMoney.fromDecimal(totals.ibsCbs.cbsDiff).value, // vDif CBS
    DecimalMoney.fromDecimal(totals.ibsCbs.cbsDevTrib).value, // vDevTrib CBS
    DecimalMoney.fromDecimal(totals.ibsCbs.cbsValue).value, // vCBS
    DecimalMoney.fromDecimal(totals.ibsCbs.cbsCredPres).value, // vCredPres
    DecimalMoney.fromDecimal(totals.ibsCbs.cbsCredPresCondSus).value, // vCredPresCondSus
  ).value;
  content += NfPipeLine.create('W60', DecimalMoney.fromDecimal(totals.ibsCbs.nfTotalValue).value).value;
  content += NfPipeLine.create('X', input.fiscal.freightMode).value;
  content += NfPipeLine.createGroupOnly('YA', false).value;
  content += NfPipeLine.create(
    'YA01',
    '',
    input.fiscal.paymentMethod,
    DecimalMoney.fromDecimal(input.fiscal.paymentValue || totals.nfValue).value,
  ).value;

  if (input.orderNumber) {
    content += NfPipeLine.create('Z', new NfSanitizedText(input.orderNumber).value).value;
  }

  return content;
}
