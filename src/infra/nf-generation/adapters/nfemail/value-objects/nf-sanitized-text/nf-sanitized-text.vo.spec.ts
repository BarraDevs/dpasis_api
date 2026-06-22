import { NfSanitizedText } from './nf-sanitized-text.vo';

describe('NfSanitizedText - Unit tests', () => {
  it('should be defined', () => {
    expect(NfSanitizedText).toBeDefined();
  });

  it('should remove accents and quotes', () => {
    // Act
    const result = new NfSanitizedText('São Paulo "teste"');

    // Assert
    expect(result.value).toBe('Sao Paulo teste');
  });

  it('should return empty string when value is null or undefined', () => {
    // Assert
    expect(new NfSanitizedText(null).value).toBe('');
    expect(new NfSanitizedText(undefined).value).toBe('');
  });
});
