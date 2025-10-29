// import { Test, TestingModule } from '@nestjs/testing';
// import { LicenseModule } from 'src/app/license/license.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { FindLicenseById } from './find-license-by-id.service';
//
// describe('FindLicenseById', () => {
//   let sut: FindLicenseById;
//   let prisma: PrismaService;
//
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         LicenseModule,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(FindLicenseById);
//     prisma = module.get(PrismaService);
//
//     await prisma.license.deleteMany();
//   });
//
//   afterAll(async() => {
//     await prisma.license.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
