import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generateDaoFile } from './dao/generate-dao-file';

export async function generateInfraPersistence(props: Props) {
  // Cria a pasta infra/persistence.
  const infraPersistencePath = path.join(props.modulePath, 'infra', 'persistence');
  await fs.mkdir(infraPersistencePath);
  await fs.writeFile(
    path.join(infraPersistencePath, `${props.moduleName}.dao.ts`),
    generateDaoFile(props)
  );
}
