// import { Test, TestingModule } from '@nestjs/testing';
// import { ProductModule } from 'src/app/product/product.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { FindAllProduct } from './find-all-product.service';
// 
// describe('FindAllProduct', () => {
//   let sut: FindAllProduct;
//   let prisma: PrismaService;
// 
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         ProductModule,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(FindAllProduct);
//     prisma = module.get(PrismaService);
//
//     await prisma.product.deleteMany();
//   });
//
//   afterEach(async() => {
//     await prisma.product.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
