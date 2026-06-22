import { NfIssueFormat } from '../../../enums/nf-issue-format.enum';
import { makeValidIssueNfInput } from '../testing/make-valid-issue-nf-input';
import { buildNfemailIssueContent } from './nfemail-issue-content.mapper';

describe('nfemail-issue-content.mapper - Unit tests', () => {
  it('should be defined', () => {
    expect(buildNfemailIssueContent).toBeDefined();
  });

  it('should build TXT when format is SEFAZ_TXT', () => {
    // Arrange
    const input = makeValidIssueNfInput({ format: NfIssueFormat.SEFAZ_TXT });

    // Act
    const result = buildNfemailIssueContent(input);

    // Assert
    expect(result.startsWith('NOTAFISCAL|1\n')).toBe(true);
    expect(result).toContain('UB12|000|000001||1.00|');
  });

  it('should build XML when format is RPS_XML', () => {
    // Arrange
    const input = makeValidIssueNfInput({ format: NfIssueFormat.RPS_XML });

    // Act
    const result = buildNfemailIssueContent(input);

    // Assert
    expect(result).toContain('<IBSCBS>');
    expect(result).toContain('<IBSCBSTot>');
    expect(result).toContain('<vNFTot>');
  });
});
