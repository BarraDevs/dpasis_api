import { Props } from 'scripts/generate-module';

export function generateModuleFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Module } from '@nestjs/common';
import { ${moduleNamePascal}Controller } from './infra/http/${moduleName}.controller';
import { ${moduleNamePascal}PersistenceModule } from './application/persistence/${moduleName}-persistence.module';

@Module({
  imports: [
    ${moduleNamePascal}PersistenceModule,
  ],
  controllers: [
    ${moduleNamePascal}Controller,
  ],
  providers: [
    // Create${moduleNamePascal},
    // Delete${moduleNamePascal},
    // Edit${moduleNamePascal},
    // FindAll${moduleNamePascal},
    // Find${moduleNamePascal}ById,
  ],
  exports: [],
})
export class ${moduleNamePascal}Module {}
`;
}
