import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateInfraHttp } from './http/generate-infra-http';
import { generateInfraPersistence } from './persistence/generate-infra-persistence';

export async function generateInfraFiles(props: Props) {
  // Cria a pasta infra.
  const infraPath = path.join(props.modulePath, 'infra');
  await fs.mkdir(infraPath);

  // Cria as pastas infra/driven e infra/drivers.
  await fs.mkdir(path.join(infraPath, 'driven'));
  await fs.mkdir(path.join(infraPath, 'drivers'));

  await generateInfraHttp(props);
  await generateInfraPersistence(props);
}
