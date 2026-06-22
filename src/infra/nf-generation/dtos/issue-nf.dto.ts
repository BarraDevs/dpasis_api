import { NfIssueFormat } from '../enums/nf-issue-format.enum';
import { IssueNfFiscalComplementDto } from './issue-nf/issue-nf-fiscal-complement.dto';
import { IssueNfItemDto } from './issue-nf/issue-nf-item.dto';
import { IssueNfPartyDto } from './issue-nf/issue-nf-party.dto';
import { IssueNfTotalsDto } from './issue-nf/issue-nf-totals.dto';
import { NfDto } from './nf.dto';

export class IssueNfInputDto {
  format: NfIssueFormat;
  orderNumber?: string;
  emitter: IssueNfPartyDto;
  recipient: IssueNfPartyDto;
  items: IssueNfItemDto[];
  fiscal: IssueNfFiscalComplementDto;
  totals?: IssueNfTotalsDto;
}

export class IssueNfOutputDto {
  externalId: number;
  nf?: NfDto;
}
