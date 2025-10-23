import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateDtoFile } from './generate-dto-file';

export async function generateApplicationDtos(props: Props) {
  // Cria a pasta application/dto.
  const dtoPath = path.join(props.modulePath, 'application', 'dtos');
  await fs.mkdir(dtoPath);

  // Cria o arquivo DTO.
  await fs.writeFile(
    path.join(dtoPath, `${props.moduleName}.dto.ts`),
    generateDtoFile(props.moduleNamePascal)
  );
}
