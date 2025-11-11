import { Props } from 'scripts/generate-module';

export function generateFindByIdUsecaseSpecFile({ moduleName, moduleNamePascal, moduleNameCamel }: Props) {
  return `// import { Test, TestingModule } from '@nestjs/testing';
// import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { Find${moduleNamePascal}ById } from './find-${moduleName}-by-id.service';
//
// describe('Find${moduleNamePascal}ById', () => {
//   let sut: Find${moduleNamePascal}ById;
//   let prisma: PrismaService;
//
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         ${moduleNamePascal}Module,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(Find${moduleNamePascal}ById);
//     prisma = module.get(PrismaService);
//
//     await prisma.${moduleNameCamel}.deleteMany();
//   });
//
//   afterEach(async() => {
//     await prisma.${moduleNameCamel}.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
`;
}
