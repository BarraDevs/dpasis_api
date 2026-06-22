import { NfRate } from './nf-rate.vo';

describe('NfRate - Unit tests', () => {
  it('should be defined', () => {
    expect(NfRate).toBeDefined();
  });

  it('should format rate with 2 decimals by default', () => {
    // Act
    const result = NfRate.fromDecimal(18);

    // Assert
    expect(result.value).toBe('18.00');
  });
});
