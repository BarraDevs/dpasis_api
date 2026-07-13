import { isNfseRpsKey, parseNfseRpsIdentificationFromKey } from './nfemail-nfse-rps-key.parser';

describe('nfemail-nfse-rps-key.parser - Unit tests', () => {
  it('should identify NFS-e RPS keys', () => {
    expect(isNfseRpsKey('RPS00000000000000500001')).toBe(true);
    expect(isNfseRpsKey('35260112345678000199550010000001001000000010')).toBe(false);
  });

  it('should parse RPS number and series from NFeMail key', () => {
    expect(parseNfseRpsIdentificationFromKey('RPS00000000000000500001')).toEqual({
      number: 5,
      series: 1,
    });
  });
});
