import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateFindByIdUsecaseFile } from './generate-find-by-id-usecase-file';
import { generateFindByIdUsecaseSpecFile } from './generate-find-by-id-usecase-spec-file';

export async function generateFindByIdUsecase(props: Props) {
  const usecasesPath = path.join(props.modulePath, 'application', 'usecases');

  // Cria a pasta application/usecases/find-by-id.
  const findByIdPath = path.join(usecasesPath, `find-${props.moduleName}-by-id`);
  await fs.mkdir(findByIdPath);
  await fs.writeFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.ts`),
    generateFindByIdUsecaseFile(props)
  );
  await fs.writeFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.spec.ts`),
    generateFindByIdUsecaseSpecFile(props)
  );

}
