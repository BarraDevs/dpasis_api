export function kebabToPascalCase(kebabStr: string) {
  return kebabStr
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function kebabToCamelCase(kebabStr: string) {
  return kebabStr
    .split('-')
    .map((word, index) =>
      index === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}
