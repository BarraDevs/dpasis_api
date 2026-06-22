import { IssueNfItemFiscalDto } from './issue-nf-item-fiscal.dto';
import { IssueNfItemIbsCbsDto } from './issue-nf-item-ibs-cbs.dto';
import { IssueNfItemTaxationDto } from './issue-nf-item-taxation.dto';

export class IssueNfItemDto {
  description: string;
  quantity: number;
  unitValueInCents: number;
  taxation: IssueNfItemTaxationDto;
  fiscal: IssueNfItemFiscalDto;
  ibsCbs: IssueNfItemIbsCbsDto;
}
