import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateCreateUsecaseDtoFile } from './dtos/generate-create-usecase-dto-file';
import { generateCreateUsecaseDtoSpecFile } from './dtos/generate-create-usecase-dto-spec-file';
import { generateCreateUsecaseFile } from './generate-create-usecase-file';
import { generateCreateUsecaseSpecFile } from './generate-create-usecase-spec-file';

export async function generateCreateUsecase(props: Props) {
  const usecasesPath = path.join(props.modulePath, 'application', 'usecases');

  // Cria a pasta application/usecases/create.
  const createPath = path.join(usecasesPath, `create-${props.moduleName}`);
  await fs.mkdir(createPath);
  await fs.writeFile(
    path.join(createPath, `create-${props.moduleName}.service.ts`),
    generateCreateUsecaseFile(props)
  );
  await fs.writeFile(
    path.join(createPath, `create-${props.moduleName}.spec.ts`),
    generateCreateUsecaseSpecFile(props)
  );

  // Cria a pasta application/usecases/create/dtos.
  const createDtoPath = path.join(createPath, 'dtos');
  await fs.mkdir(createDtoPath);
  await fs.writeFile(
    path.join(createDtoPath, `create-${props.moduleName}.dto.ts`),
    generateCreateUsecaseDtoFile(props)
  );
  await fs.writeFile(
    path.join(createDtoPath, `create-${props.moduleName}-dto.spec.ts`),
    generateCreateUsecaseDtoSpecFile(props)
  );
}
