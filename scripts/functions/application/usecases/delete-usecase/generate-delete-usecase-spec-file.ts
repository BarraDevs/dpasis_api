import { Props } from 'scripts/generate-module';

export function generateDeleteUsecaseSpecFile({ moduleName, moduleNamePascal, moduleNameCamel }: Props) {
  return `// import { Test, TestingModule } from '@nestjs/testing';
// import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { Delete${moduleNamePascal} } from './delete-${moduleName}.service';
//
// describe('Delete${moduleNamePascal}', () => {
//   let sut: Delete${moduleNamePascal};
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
//     sut = module.get(Delete${moduleNamePascal});
//     prisma = module.get(PrismaService);
//
//     await prisma.${moduleNameCamel}.deleteMany();
//   });
//
//   afterAll(async() => {
//     await prisma.${moduleNameCamel}.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
`;
}
