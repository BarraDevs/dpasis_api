"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModuleFile = generateModuleFile;
function generateModuleFile({ moduleName, moduleNamePascal }) {
    return `import { Module } from '@nestjs/common';
import { ${moduleNamePascal}PersistenceModule } from './application/persistence/${moduleName}-persistence.module';
import { ${moduleNamePascal}Controller } from './infra/drivers/http/${moduleName}.controller';

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
//# sourceMappingURL=generate-module-file.js.map