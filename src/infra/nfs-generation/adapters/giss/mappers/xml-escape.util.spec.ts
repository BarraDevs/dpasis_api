import { XmlEscapeUtil } from './xml-escape.util';

describe('XmlEscapeUtil.escape - Unit tests', () => {
  it('should be defined', () => {
    expect(XmlEscapeUtil).toBeDefined();
  });

  it.each([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ['\'', '&apos;'],
  ])('should escape %s as %s', (input, expected) => {
    // Act
    const result = XmlEscapeUtil.escape(input);

    // Assert
    expect(result).toBe(expected);
  });

  it('should escape all special characters in one string', () => {
    // Act
    const result = XmlEscapeUtil.escape('a&b<c>d"e\'f');

    // Assert
    expect(result).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });

  it('should return plain text unchanged', () => {
    // Act
    const result = XmlEscapeUtil.escape('João desenvolvimento');

    // Assert
    expect(result).toBe('João desenvolvimento');
  });

  it('should return empty string for empty input', () => {
    // Act
    const result = XmlEscapeUtil.escape('');

    // Assert
    expect(result).toBe('');
  });
});
