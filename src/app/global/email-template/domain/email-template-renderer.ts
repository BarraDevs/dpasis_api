function placeholderPattern(): RegExp {
  return /\{\{\s*([A-Za-z][A-Za-z0-9_.]{0,127})\s*\}\}/g;
}

export function extractEmailTemplatePlaceholderKeys(...texts: string[]): string[] {
  const keys = new Set<string>();

  for (const text of texts) {
    for (const match of text.matchAll(placeholderPattern())) {
      keys.add(match[1]);
    }
  }

  return [...keys];
}

export function interpolateEmailTemplate(text: string, values: Record<string, string>): string {
  return text.replace(placeholderPattern(), (full, key: string) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : full;
  });
}
