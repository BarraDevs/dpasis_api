import { NfIssueFormat } from '../enums/nf-issue-format.enum';
import { NfDto } from './nf.dto';

export class IssueNfInputDto {
  content: string;
  format: NfIssueFormat;
}

export class IssueNfOutputDto {
  externalId: number;
  nf?: NfDto;
}
