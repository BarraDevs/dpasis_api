import { Props } from 'scripts/generate-module';

export function generatePersistenceModuleFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ${moduleNamePascal}DaoAdapterPrisma } from '../../infra/persistence/${moduleName}.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.${moduleNamePascal}Dao,
    useClass: ${moduleNamePascal}DaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ${moduleNamePascal}PersistenceModule {}
`;
}
