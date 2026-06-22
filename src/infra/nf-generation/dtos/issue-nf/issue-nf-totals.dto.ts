import { IssueNfTotalsIbsCbsDto } from './issue-nf-totals-ibs-cbs.dto';

export class IssueNfTotalsDto {
  productValue: number;
  nfValue: number;
  icmsBase: number;
  icmsValue: number;
  ibsCbs: IssueNfTotalsIbsCbsDto;
}
