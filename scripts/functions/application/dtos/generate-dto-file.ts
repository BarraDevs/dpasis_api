export function generateDtoFile(pascalCaseModule: string) {
  return `export class ${pascalCaseModule}Dto {}`;
}
