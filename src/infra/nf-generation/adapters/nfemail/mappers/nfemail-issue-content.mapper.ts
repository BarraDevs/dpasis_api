import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { NfIssueFormat } from '../../../enums/nf-issue-format.enum';
import { buildNfemailIssueRpsXml } from './nfemail-issue-rps-xml.mapper';
import { buildNfemailIssueTxt } from './nfemail-issue-txt.mapper';
import { buildNfemailIssueXml } from './nfemail-issue-xml.mapper';

export function buildNfemailIssueContent(input: IssueNfInputDto): string {
  if (input.format === NfIssueFormat.RPS_XML) {
    return buildNfemailIssueRpsXml(input);
  }

  if (input.format === NfIssueFormat.NFE_XML) {
    return buildNfemailIssueXml(input);
  }

  return buildNfemailIssueTxt(input);
}
