import * as fs from 'fs/promises';
import * as path from 'path';
import { Props } from 'scripts/generate-module';
import { generatePersistenceDaoInterfaceFile } from './dao/generate-persistence-dao-interface-file';
import { generatePersistenceModuleFile } from './generate-persistence-module-file';

export async function generateApplicationPersistence(props: Props) {
  // Cria a pasta application/persistence.
  const persistencePath = path.join(props.modulePath, 'application', 'persistence');
  await fs.mkdir(persistencePath);

  // Criar o módulo de persistence.
  await fs.writeFile(
    path.join(persistencePath, `${props.moduleName}-persistence.module.ts`),
    generatePersistenceModuleFile(props)
  );

  // Cria a pasta application/persistence/dao.
  const daoPath = path.join(persistencePath, 'dao');
  await fs.mkdir(daoPath);

  // Cria o arquivo de interface DAO.
  await fs.writeFile(
    path.join(daoPath, `${props.moduleName}-dao.interface.ts`),
    generatePersistenceDaoInterfaceFile(props)
  );
}
