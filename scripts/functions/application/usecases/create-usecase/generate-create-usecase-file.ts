import { Props } from 'scripts/generate-module';

export function generateCreateUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { Create${moduleNamePascal}InputDto, Create${moduleNamePascal}OutputDto } from './dtos/create-${moduleName}.dto';

@Injectable()
export class Create${moduleNamePascal} {
  constructor() {}

  public async execute(data: Create${moduleNamePascal}InputDto): Promise<Create${moduleNamePascal}OutputDto> {
    // Lógica para criar um ${moduleNameCamel}.
  }
}
`;
}
