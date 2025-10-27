"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreateUsecaseSpecFile = generateCreateUsecaseSpecFile;
function generateCreateUsecaseSpecFile({ moduleName, moduleNamePascal, moduleNameCamel }) {
    return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { Create${moduleNamePascal} } from './create-${moduleName}.service';

describe('Create${moduleNamePascal}', () => {
  let sut: Create${moduleNamePascal};
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ${moduleNamePascal}Module,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(Create${moduleNamePascal});
    prisma = module.get(PrismaService);

    await prisma.${moduleNameCamel}.deleteMany();
  });

  afterAll(async() => {
    await prisma.${moduleNameCamel}.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
`;
}
//# sourceMappingURL=generate-create-usecase-spec-file.js.map