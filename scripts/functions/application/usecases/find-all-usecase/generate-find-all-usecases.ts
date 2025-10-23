import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateFindAllUsecaseDtoFile } from './dtos/generate-find-all-usecase-dto-file';
import { generateFindAllUsecaseDtoSpecFile } from './dtos/generate-find-all-usecase-dto-spec-file';
import { generateFindAllUsecaseFile } from './generate-find-all-usecase-file';
import { generateFindAllUsecaseSpecFile } from './generate-find-all-usecase-spec-file';

export async function generateFindAllUsecase(props: Props) {
  const usecasesPath = path.join(props.modulePath, 'application', 'usecases');

  // Cria a pasta application/usecases/find-all.
  const findAllPath = path.join(usecasesPath, `find-all-${props.moduleName}`);
  await fs.mkdir(findAllPath);
  await fs.writeFile(
    path.join(findAllPath, `find-all-${props.moduleName}.service.ts`),
    generateFindAllUsecaseFile(props)
  );
  await fs.writeFile(
    path.join(findAllPath, `find-all-${props.moduleName}.spec.ts`),
    generateFindAllUsecaseSpecFile(props)
  );

  // Cria a pasta application/usecases/find-all/dtos.
  const findAllDtoPath = path.join(findAllPath, 'dtos');
  await fs.mkdir(findAllDtoPath);
  await fs.writeFile(
    path.join(findAllDtoPath, `find-all-${props.moduleName}.dto.ts`),
    generateFindAllUsecaseDtoFile(props)
  );
  await fs.writeFile(
    path.join(findAllDtoPath, `find-all-${props.moduleName}-dto.spec.ts`),
    generateFindAllUsecaseDtoSpecFile(props)
  );
}
