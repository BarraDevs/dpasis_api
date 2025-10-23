import { Props } from 'scripts/generate-module';

export function generatePersistenceDaoInterfaceFile({ moduleName, moduleNamePascal }: Props) {
  return `import { ${moduleNamePascal}Dto } from '../../dtos/${moduleName}.dto';
import { Create${moduleNamePascal}InputDto } from '../../usecases/create-${moduleName}/dtos/create-${moduleName}.dto';
import { FindAll${moduleNamePascal}QueryDto } from '../../usecases/find-all-${moduleName}/dtos/find-all-${moduleName}.dto';

export interface I${moduleNamePascal}Dao {
  findAll(queries: FindAll${moduleNamePascal}QueryDto): Promise<[${moduleNamePascal}Dto[], number]>;
  findById(id: string): Promise<${moduleNamePascal}Dto | null>;
  save(data: Create${moduleNamePascal}InputDto): Promise<string>;
  edit(id: string, data: Create${moduleNamePascal}InputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
`;
}
