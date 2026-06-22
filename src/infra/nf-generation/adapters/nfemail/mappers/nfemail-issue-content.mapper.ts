import { IssueNfInputDto } from '../../../dtos/issue-nf.dto';
import { NfIssueFormat } from '../../../enums/nf-issue-format.enum';
import { buildNfemailIssueTxt } from './nfemail-issue-txt.mapper';
import { buildNfemailIssueXml } from './nfemail-issue-xml.mapper';

export function buildNfemailIssueContent(input: IssueNfInputDto): string {
  if (input.format === NfIssueFormat.RPS_XML) {
    return buildNfemailIssueXml(input);
  }

  return buildNfemailIssueTxt(input);
}
