import * as path from 'path';
import type { Props } from '../config';
import { TEMPLATES, VALIDATORS_PATH } from '../config';
import { writeGeneratedFile } from '../utils/fs';
import { renderTemplate } from '../utils/render';

const T = TEMPLATES.application;

function getContext(props: Props) {
  return {
    moduleName: props.moduleName,
    moduleNamePascal: props.moduleNamePascal,
    moduleNameCamel: props.moduleNameCamel,
    validatorsPath: VALIDATORS_PATH,
    field: 'field',
  };
}

export async function generateApplication(props: Props): Promise<void> {
  const ctx = getContext(props);
  const appPath = path.join(props.modulePath, 'application');
  const persistencePath = path.join(appPath, 'persistence');
  const usecasesPath = path.join(appPath, 'usecases');
  const isDdd = props.mode === 'ddd';

  // DTOs
  await writeGeneratedFile(
    path.join(appPath, 'dtos', `${props.moduleName}.dto.ts`),
    renderTemplate(T.dto, ctx)
  );

  // Persistence
  const persistenceModuleTemplate = isDdd ? T.persistence.moduleDdd : T.persistence.module;
  const daoInterfaceTemplate = isDdd ? T.persistence.daoInterfaceDdd : T.persistence.daoInterface;

  await writeGeneratedFile(
    path.join(persistencePath, `${props.moduleName}-persistence.module.ts`),
    renderTemplate(persistenceModuleTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(persistencePath, 'dao', `${props.moduleName}-dao.interface.ts`),
    renderTemplate(daoInterfaceTemplate, ctx)
  );
  if (isDdd) {
    await writeGeneratedFile(
      path.join(persistencePath, 'repository', `${props.moduleName}-repository.interface.ts`),
      renderTemplate(T.persistence.repositoryInterface, ctx)
    );
  }

  // Use cases
  const create = T.usecases.create;
  const edit = T.usecases.edit;
  const del = T.usecases.delete;
  const findAll = T.usecases.findAll;
  const findById = T.usecases.findById;

  // Create
  const createPath = path.join(usecasesPath, `create-${props.moduleName}`);
  const createServiceTemplate = isDdd ? create.serviceDdd : create.service;
  await writeGeneratedFile(
    path.join(createPath, `create-${props.moduleName}.service.ts`),
    renderTemplate(createServiceTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(createPath, `create-${props.moduleName}.service.spec.ts`),
    renderTemplate(create.serviceSpec, ctx)
  );
  await writeGeneratedFile(
    path.join(createPath, 'dtos', `create-${props.moduleName}.dto.ts`),
    renderTemplate(create.dtos.dto, ctx)
  );
  await writeGeneratedFile(
    path.join(createPath, 'dtos', `create-${props.moduleName}-dto.spec.ts`),
    renderTemplate(create.dtos.dtoSpec, ctx)
  );

  // Edit
  const editPath = path.join(usecasesPath, `edit-${props.moduleName}`);
  const editServiceTemplate = isDdd ? edit.serviceDdd : edit.service;
  await writeGeneratedFile(
    path.join(editPath, `edit-${props.moduleName}.service.ts`),
    renderTemplate(editServiceTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(editPath, `edit-${props.moduleName}.service.spec.ts`),
    renderTemplate(edit.serviceSpec, ctx)
  );
  await writeGeneratedFile(
    path.join(editPath, 'dtos', `edit-${props.moduleName}.dto.ts`),
    renderTemplate(edit.dtos.dto, ctx)
  );
  await writeGeneratedFile(
    path.join(editPath, 'dtos', `edit-${props.moduleName}-dto.spec.ts`),
    renderTemplate(edit.dtos.dtoSpec, ctx)
  );

  // Delete
  const deletePath = path.join(usecasesPath, `delete-${props.moduleName}`);
  const deleteServiceTemplate = isDdd ? del.serviceDdd : del.service;
  await writeGeneratedFile(
    path.join(deletePath, `delete-${props.moduleName}.service.ts`),
    renderTemplate(deleteServiceTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(deletePath, `delete-${props.moduleName}.service.spec.ts`),
    renderTemplate(del.serviceSpec, ctx)
  );

  // Find All
  const findAllPath = path.join(usecasesPath, `find-all-${props.moduleName}`);
  const findAllServiceTemplate = isDdd ? findAll.serviceDdd : findAll.service;
  await writeGeneratedFile(
    path.join(findAllPath, `find-all-${props.moduleName}.service.ts`),
    renderTemplate(findAllServiceTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(findAllPath, `find-all-${props.moduleName}.service.spec.ts`),
    renderTemplate(findAll.serviceSpec, ctx)
  );
  await writeGeneratedFile(
    path.join(findAllPath, 'dtos', `find-all-${props.moduleName}.dto.ts`),
    renderTemplate(findAll.dtos.dto, ctx)
  );
  await writeGeneratedFile(
    path.join(findAllPath, 'dtos', `find-all-${props.moduleName}-dto.spec.ts`),
    renderTemplate(findAll.dtos.dtoSpec, ctx)
  );

  // Find By Id
  const findByIdPath = path.join(usecasesPath, `find-${props.moduleName}-by-id`);
  const findByIdServiceTemplate = isDdd ? findById.serviceDdd : findById.service;
  await writeGeneratedFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.ts`),
    renderTemplate(findByIdServiceTemplate, ctx)
  );
  await writeGeneratedFile(
    path.join(findByIdPath, `find-${props.moduleName}-by-id.service.spec.ts`),
    renderTemplate(findById.serviceSpec, ctx)
  );
}
