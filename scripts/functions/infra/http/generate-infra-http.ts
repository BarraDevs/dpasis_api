import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateControllerFile } from './controller/generate-controller-file';

export async function generateInfraHttp(props: Props) {
  // Cria a pasta infra/http.
  const infraHttpPath = path.join(props.modulePath, 'infra', 'http');
  await fs.mkdir(infraHttpPath);
  await fs.writeFile(
    path.join(infraHttpPath, `${props.moduleName}.controller.ts`),
    generateControllerFile(props)
  );
}
