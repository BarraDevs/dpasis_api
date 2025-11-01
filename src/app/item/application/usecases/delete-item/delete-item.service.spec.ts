// import { Test, TestingModule } from '@nestjs/testing';
// import { ItemModule } from 'src/app/item/item.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { DeleteItem } from './delete-item.service';
//
// describe('DeleteItem', () => {
//   let sut: DeleteItem;
//   let prisma: PrismaService;
//
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         ItemModule,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(DeleteItem);
//     prisma = module.get(PrismaService);
//
//     await prisma.item.deleteMany();
//   });
//
//   afterAll(async() => {
//     await prisma.item.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
