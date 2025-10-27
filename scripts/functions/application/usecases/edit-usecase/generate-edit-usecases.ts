import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateEditUsecaseDtoFile } from './dtos/generate-edit-usecase-dto-file';
import { generateEditUsecaseDtoSpecFile } from './dtos/generate-edit-usecase-dto-spec-file';
import { generateEditUsecaseFile } from './generate-edit-usecase-file';
import { generateEditUsecaseSpecFile } from './generate-edit-usecase-spec-file';

export async function generateEditUsecase(props: Props) {
  const usecasesPath = path.join(props.modulePath, 'application', 'usecases');

  // Cria a pasta application/usecases/edit.
  const editPath = path.join(usecasesPath, `edit-${props.moduleName}`);
  await fs.mkdir(editPath);
  await fs.writeFile(
    path.join(editPath, `edit-${props.moduleName}.service.ts`),
    generateEditUsecaseFile(props)
  );
  await fs.writeFile(
    path.join(editPath, `edit-${props.moduleName}.service.spec.ts`),
    generateEditUsecaseSpecFile(props)
  );

  // Cria a pasta application/usecases/edit/dtos.
  const editDtoPath = path.join(editPath, 'dtos');
  await fs.mkdir(editDtoPath);
  await fs.writeFile(
    path.join(editDtoPath, `edit-${props.moduleName}.dto.ts`),
    generateEditUsecaseDtoFile(props)
  );
  await fs.writeFile(
    path.join(editDtoPath, `edit-${props.moduleName}-dto.spec.ts`),
    generateEditUsecaseDtoSpecFile(props)
  );
}
