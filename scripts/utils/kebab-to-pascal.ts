export function kebabToPascalCase(kebabStr: string) {
  return kebabStr
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
