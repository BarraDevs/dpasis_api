import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateDeleteUsecaseFile } from './generate-delete-usecase-file';
import { generateDeleteUsecaseSpecFile } from './generate-delete-usecase-spec-file';

export async function generateDeleteUsecase(props: Props) {
  const usecasesPath = path.join(props.modulePath, 'application', 'usecases');

  // Cria a pasta application/usecases/delete.
  const deletePath = path.join(usecasesPath, `delete-${props.moduleName}`);
  await fs.mkdir(deletePath);
  await fs.writeFile(
    path.join(deletePath, `delete-${props.moduleName}.service.ts`),
    generateDeleteUsecaseFile(props)
  );
  await fs.writeFile(
    path.join(deletePath, `delete-${props.moduleName}.service.spec.ts`),
    generateDeleteUsecaseSpecFile(props)
  );
}
