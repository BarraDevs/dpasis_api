import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateCreateUsecase } from './create-usecase/generate-create-usecase';
import { generateDeleteUsecase } from './delete-usecase/generate-delete-usecases';
import { generateEditUsecase } from './edit-usecase/generate-edit-usecases';
import { generateFindAllUsecase } from './find-all-usecase/generate-find-all-usecases';
import { generateFindByIdUsecase } from './find-by-id-usecase/generate-find-by-id-usecases';

export async function generateApplicationUsecases(props: Props) {
  // Cria a pasta application/usecases.
  const usecasesPath = path.join(props.modulePath, 'application', 'usecases');
  await fs.mkdir(usecasesPath);

  await Promise.all([
    generateCreateUsecase(props),
    generateDeleteUsecase(props),
    generateEditUsecase(props),
    generateFindAllUsecase(props),
    generateFindByIdUsecase(props),
  ]);
}
