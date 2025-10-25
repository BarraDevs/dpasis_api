import { Props } from 'scripts/generate-module';

export function generateFindAllUsecaseSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `// import { Test, TestingModule } from '@nestjs/testing';
// import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { FindAll${moduleNamePascal} } from './find-all-${moduleName}.service';
// 
// describe('FindAll${moduleNamePascal}', () => {
//   let sut: FindAll${moduleNamePascal};
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
//     sut = module.get(FindAll${moduleNamePascal});
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
`;
}
