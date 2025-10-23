import { Props } from 'scripts/generate-module';

export function generateEditUsecaseFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Injectable } from '@nestjs/common';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Edit${moduleNamePascal}InputDto } from './dtos/edit-${moduleName}.dto';

@Injectable()
export class Edit${moduleNamePascal} {
  constructor() {}

  public async execute(id: string, data: Edit${moduleNamePascal}InputDto): Promise<SuccessMessage> {
    return { message: 'Edição realizada com sucesso' };
  }
}
`;
}
