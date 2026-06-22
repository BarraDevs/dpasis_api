import { makeValidIssueNfInput } from '../testing/make-valid-issue-nf-input';
import { resolveIssueNfTotals } from './nfemail-issue-totals.calculator';

describe('nfemail-issue-totals.calculator - Unit tests', () => {
  let input = makeValidIssueNfInput();

  beforeEach(() => {
    input = makeValidIssueNfInput();
  });

  it('should be defined', () => {
    expect(resolveIssueNfTotals).toBeDefined();
  });

  it('should aggregate RT totals from items when totals is omitted', () => {
    // Act
    const result = resolveIssueNfTotals(input);

    // Assert
    expect(result.productValue).toBe(1);
    expect(result.ibsCbs.baseValue).toBe(1);
    expect(result.ibsCbs.cbsValue).toBe(0.1);
    expect(result.ibsCbs.nfTotalValue).toBe(1);
  });

  it('should keep explicit totals when provided', () => {
    // Arrange
    input.totals = {
      productValue: 2,
      nfValue: 2,
      icmsBase: 2,
      icmsValue: 0.36,
      ibsCbs: {
        baseValue: 2,
        ibsStateDiff: 0,
        ibsStateDevTrib: 0,
        ibsStateValue: 0,
        ibsCityDiff: 0,
        ibsCityDevTrib: 0,
        ibsCityValue: 0,
        ibsDiff: 0,
        ibsDevTrib: 0,
        ibsTotalValue: 0,
        ibsCredPres: 0,
        ibsCredPresCondSus: 0,
        cbsDiff: 0,
        cbsDevTrib: 0,
        cbsValue: 0.2,
        cbsCredPres: 0,
        cbsCredPresCondSus: 0,
        nfTotalValue: 2,
      },
    };

    // Act
    const result = resolveIssueNfTotals(input);

    // Assert
    expect(result.nfValue).toBe(2);
    expect(result.ibsCbs.cbsValue).toBe(0.2);
  });
});
