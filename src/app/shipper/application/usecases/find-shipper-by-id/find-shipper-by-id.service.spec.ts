// import { Test, TestingModule } from '@nestjs/testing';
// import { ShipperModule } from 'src/app/shipper/shipper.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { FindShipperById } from './find-shipper-by-id.service';
//
// describe('FindShipperById', () => {
//   let sut: FindShipperById;
//   let prisma: PrismaService;
//
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         ShipperModule,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(FindShipperById);
//     prisma = module.get(PrismaService);
//
//     await prisma.shipper.deleteMany();
//   });
//
//   afterEach(async() => {
//     await prisma.shipper.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
