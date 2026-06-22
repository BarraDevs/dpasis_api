import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeValidIssueNfInput } from '../testing/make-valid-issue-nf-input';
import { buildNfemailIssueTxt } from './nfemail-issue-txt.mapper';

describe('nfemail-issue-txt.mapper - Unit tests', () => {
  const fixturePath = join(__dirname, '../fixtures/NOTAFISCAL400_RT_NovosCampos.txt');

  it('should be defined', () => {
    expect(buildNfemailIssueTxt).toBeDefined();
  });

  it('should include all RT pipe groups', () => {
    // Arrange
    const input = makeValidIssueNfInput();
    const fixture = readFileSync(fixturePath, 'utf-8');

    // Act
    const result = buildNfemailIssueTxt(input);

    // Assert
    for (const group of ['UB12|', 'UB15|', 'UB17|', 'UB36|', 'UB55|', 'VB01|', 'W34|', 'W60|']) {
      expect(result).toContain(group);
    }

    expect(fixture).toContain('UB12|000|000001||1.00|');
    expect(result).toContain('UB12|000|000001||1.00|');
    expect(result).toContain('UB55|0.90|0.10|');
    expect(result).toContain('W60|1.00|');
  });

  it('should place tpAmb (environment) correctly in B group', () => {
    // Arrange
    const input = makeValidIssueNfInput();

    // Act
    const result = buildNfemailIssueTxt(input);

    // Assert — B group has 23 fields; tpAmb is field 15 (index after 'B|')
    const bLine = result.split('\n').find(line => line.startsWith('B|'));
    expect(bLine).toBeDefined();
    const fields = bLine!.split('|');
    // fields[0]=B, [1]=cUF, [2]=cNF, [3]=natOp, [4]=mod, [5]=serie, [6]=nNF,
    // [7]=dhEmi, [8]=dhSaiEnt, [9]=tpNF, [10]=idDest, [11]=cMunFG,
    // [12]=tpImp, [13]=tpEmis, [14]=cDV, [15]=tpAmb, [16]=finNFe, ...
    expect(fields[12]).toBe('1'); // tpImp
    expect(fields[15]).toBe('2'); // tpAmb = homologação
    expect(fields[16]).toBe('1'); // finNFe = normal
    expect(fields[18]).toBe('9'); // indPres = 9 (não presencial outros)
  });

  it('should emit B25c line for indIntermed', () => {
    // Arrange
    const input = makeValidIssueNfInput();

    // Act
    const result = buildNfemailIssueTxt(input);

    // Assert
    expect(result).toContain('B25c|0|');
  });

  it('should map W IBS/CBS totals to correct pipe groups', () => {
    // Arrange
    const input = makeValidIssueNfInput();

    // Act
    const result = buildNfemailIssueTxt(input);

    // Assert — per NFeMail TXT layout v5.2025:
    // W34|vBCIBSCBS|  W36|vIBS|vCredPres|vCredPresCondSus|
    // W37|vDif|vDevTrib|vIBSUF|  W42|vDif|vDevTrib|vIBSMun|
    // W50|vDif|vDevTrib|vCBS|vCredPres|vCredPresCondSus|  W60|vNFTot|
    expect(result).toContain('W34|1.00|');
    expect(result).toContain('W36|0.00|0.00|0.00|'); // ibsTotalValue=0|ibsCredPres=0|ibsCredPresCondSus=0
    expect(result).toContain('W37|0.00|0.00|0.00|'); // ibsStateDiff=0|ibsStateDevTrib=0|ibsStateValue=0
    expect(result).toContain('W42|0.00|0.00|0.00|'); // ibsCityDiff=0|ibsCityDevTrib=0|ibsCityValue=0
    expect(result).toContain('W50|0.00|0.00|0.10|0.00|0.00|'); // cbsDiff=0|cbsDevTrib=0|vCBS=0.10|cbsCredPres=0|...
    expect(result).toContain('W60|1.00|');
  });

  it('should use emitter CRT from input in C group', () => {
    // Arrange
    const input = makeValidIssueNfInput();

    // Act
    const result = buildNfemailIssueTxt(input);

    // Assert — crt:3 from makeValidIssueNfInput should appear in C group (last field)
    const cLine = result.split('\n').find(line => line.startsWith('C|'));
    expect(cLine).toBeDefined();
    expect(cLine).toContain('|3|');
  });
});
