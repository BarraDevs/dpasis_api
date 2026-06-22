import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { IssueNfItemDto } from '../../../dtos/issue-nf/issue-nf-item.dto';
import { IssueNfTotalsDto } from '../../../dtos/issue-nf/issue-nf-totals.dto';
import { IssueNfTotalsIbsCbsDto } from '../../../dtos/issue-nf/issue-nf-totals-ibs-cbs.dto';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumItemProductValue(item: IssueNfItemDto): number {
  return roundMoney((item.quantity * item.unitValueInCents) / 100);
}

function buildIbsCbsTotals(items: IssueNfItemDto[]): IssueNfTotalsIbsCbsDto {
  const productTotal = roundMoney(items.reduce((sum, item) => sum + sumItemProductValue(item), 0));

  return {
    baseValue: roundMoney(items.reduce((sum, item) => sum + item.ibsCbs.baseValue, 0)),
    ibsStateDiff: 0,
    ibsStateDevTrib: 0,
    ibsStateValue: roundMoney(items.reduce((sum, item) => sum + item.ibsCbs.ibsStateValue, 0)),
    ibsCityDiff: 0,
    ibsCityDevTrib: 0,
    ibsCityValue: roundMoney(items.reduce((sum, item) => sum + item.ibsCbs.ibsCityValue, 0)),
    ibsDiff: 0,
    ibsDevTrib: 0,
    ibsTotalValue: roundMoney(items.reduce((sum, item) => sum + item.ibsCbs.ibsTotalValue, 0)),
    ibsCredPres: 0,
    ibsCredPresCondSus: 0,
    cbsDiff: 0,
    cbsDevTrib: 0,
    cbsValue: roundMoney(items.reduce((sum, item) => sum + item.ibsCbs.cbsValue, 0)),
    cbsCredPres: 0,
    cbsCredPresCondSus: 0,
    nfTotalValue: roundMoney(items.reduce((sum, item) => sum + item.ibsCbs.itemTotalValue, 0) || productTotal),
  };
}

export function resolveIssueNfTotals(input: IssueNfInputDto): IssueNfTotalsDto {
  if (input.totals) {
    return input.totals;
  }

  const productValue = roundMoney(input.items.reduce((sum, item) => sum + sumItemProductValue(item), 0));
  const icmsBase = roundMoney(input.items.reduce((sum, item) => sum + item.fiscal.icmsBase, 0));
  const icmsValue = roundMoney(input.items.reduce((sum, item) => sum + item.fiscal.icmsValue, 0));
  const ibsCbs = buildIbsCbsTotals(input.items);

  return {
    productValue,
    nfValue: ibsCbs.nfTotalValue || productValue,
    icmsBase,
    icmsValue,
    ibsCbs,
  };
}
