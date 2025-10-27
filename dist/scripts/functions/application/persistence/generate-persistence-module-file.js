"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePersistenceModuleFile = generatePersistenceModuleFile;
function generatePersistenceModuleFile({ moduleName, moduleNamePascal }) {
    return `import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ${moduleNamePascal}DaoAdapterPrisma } from '../../infra/driven/persistence/${moduleName}.dao';

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
//# sourceMappingURL=generate-persistence-module-file.js.map