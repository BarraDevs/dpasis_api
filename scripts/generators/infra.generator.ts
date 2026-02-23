import * as path from 'path';
import type { Props } from '../config';
import { TEMPLATES } from '../config';
import { writeGeneratedFile } from '../utils/fs';
import { renderTemplate } from '../utils/render';

const T = TEMPLATES.infra;

function getContext(props: Props) {
  return {
    moduleName: props.moduleName,
    moduleNamePascal: props.moduleNamePascal,
    moduleNameCamel: props.moduleNameCamel,
  };
}

export async function generateInfra(props: Props): Promise<void> {
  const ctx = getContext(props);
  const isDdd = props.mode === 'ddd';

  // HTTP Controller
  const httpPath = path.join(props.modulePath, 'infra', 'drivers', 'http');
  await writeGeneratedFile(
    path.join(httpPath, `${props.moduleName}.controller.ts`),
    renderTemplate(T.controller, ctx)
  );
  await writeGeneratedFile(
    path.join(httpPath, `${props.moduleName}.controller.spec.ts`),
    renderTemplate(T.controllerSpec, ctx)
  );

  // Persistence DAO
  const persistencePath = path.join(props.modulePath, 'infra', 'driven', 'persistence', 'prisma');
  const daoTemplate = isDdd ? T.daoDdd : T.dao;
  await writeGeneratedFile(
    path.join(persistencePath, `${props.moduleName}-prisma.dao.ts`),
    renderTemplate(daoTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(persistencePath, `${props.moduleName}-prisma.dao.spec.ts`),
    renderTemplate(T.daoSpec, ctx)
  );

  // Repository
  if (isDdd) {
    await writeGeneratedFile(
      path.join(persistencePath, `${props.moduleName}-prisma.repository.ts`),
      renderTemplate(T.repository, ctx)
    );
    await writeGeneratedFile(
      path.join(persistencePath, `${props.moduleName}-prisma.repository.spec.ts`),
      renderTemplate(T.repositorySpec, ctx)
    );
  }
}
