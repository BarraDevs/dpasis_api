import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateControllerFile } from './controller/generate-controller-file';
import { generateControllerSpecFile } from './controller/generate-controller-spec-file';

export async function generateInfraHttp(props: Props) {
  // Cria a pasta infra/drivers/http.
  const infraHttpPath = path.join(props.modulePath, 'infra', 'drivers', 'http');
  await fs.mkdir(infraHttpPath);

  await fs.writeFile(
    path.join(infraHttpPath, `${props.moduleName}.controller.ts`),
    generateControllerFile(props)
  );
  await fs.writeFile(
    path.join(infraHttpPath, `${props.moduleName}.controller.spec.ts`),
    generateControllerSpecFile(props)
  );
}
