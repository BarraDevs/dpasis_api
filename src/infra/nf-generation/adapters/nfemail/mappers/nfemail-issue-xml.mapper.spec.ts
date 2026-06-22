import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeValidIssueNfInput } from '../testing/make-valid-issue-nf-input';
import { buildNfemailIssueXml } from './nfemail-issue-xml.mapper';

describe('nfemail-issue-xml.mapper - Unit tests', () => {
  const fixturePath = join(__dirname, '../fixtures/NOTAFISCAL_RT_NovosCampos.xml');

  it('should be defined', () => {
    expect(buildNfemailIssueXml).toBeDefined();
  });

  it('should include RT xml tags and values from input', () => {
    // Arrange
    const input = makeValidIssueNfInput();
    const fixture = readFileSync(fixturePath, 'utf-8');

    // Act
    const result = buildNfemailIssueXml(input);

    // Assert
    expect(fixture).toContain('<IBSCBS>');
    expect(fixture).toContain('<IBSCBSTot>');
    expect(fixture).toContain('<vNFTot>');

    expect(result).toContain('<IBSCBS>');
    expect(result).toContain('<CST>000</CST>');
    expect(result).toContain('<cClassTrib>000001</cClassTrib>');
    expect(result).toContain('<gIBSUF>');
    expect(result).toContain('<gCBS>');
    expect(result).toContain('<IBSCBSTot>');
    expect(result).toContain('<vNFTot>1.00</vNFTot>');
    expect(result).toContain('<vItem>1.00</vItem>');
    expect(result).not.toContain('<Signature');
  });
});
