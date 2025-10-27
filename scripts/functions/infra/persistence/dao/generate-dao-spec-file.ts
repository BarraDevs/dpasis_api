import { Props } from 'scripts/generate-module';

export function generateDaoSpecFile({ moduleName, moduleNameCamel, moduleNamePascal }: Props) {
  return `import { Test } from '@nestjs/testing';
import { ${moduleNamePascal}PersistenceModule } from 'src/app/${moduleName}/application/persistence/${moduleName}-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ${moduleNamePascal}DaoAdapterPrisma } from './${moduleName}.dao';

describe('${moduleNamePascal}DaoAdapterPrisma', () => {
  let sut: ${moduleNamePascal}DaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ${moduleNamePascal}PersistenceModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(${moduleNamePascal}DaoAdapterPrisma);
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
