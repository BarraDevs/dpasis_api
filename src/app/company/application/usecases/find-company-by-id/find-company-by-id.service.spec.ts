// import { Test, TestingModule } from '@nestjs/testing';
// import { CompanyModule } from 'src/app/company/company.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { FindCompanyById } from './find-company-by-id.service';
//
// describe('FindCompanyById', () => {
//   let sut: FindCompanyById;
//   let prisma: PrismaService;
//
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         CompanyModule,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(FindCompanyById);
//     prisma = module.get(PrismaService);
//
//     await prisma.company.deleteMany();
//   });
//
//   afterAll(async() => {
//     await prisma.company.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
