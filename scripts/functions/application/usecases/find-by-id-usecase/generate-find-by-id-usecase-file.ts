import { Props } from 'scripts/generate-module';

export function generateFindByIdUsecaseFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { ${moduleNamePascal}Dto } from '../../dtos/${moduleName}.dto';

@Injectable()
export class Find${moduleNamePascal}ById {
  constructor() {}

  public async execute(id: string): Promise<${moduleNamePascal}Dto> {}
}
`;
}
