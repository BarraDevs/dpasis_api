// import { Test, TestingModule } from '@nestjs/testing';
// import { AttachmentModule } from 'src/app/attachment/attachment.module';
// import { ConfigModule } from 'src/core/config/config.module';
// import { PrismaService } from 'src/infra/database/prisma/prisma.service';
// import { EditAttachment } from './edit-attachment.service';
//
// describe('EditAttachment', () => {
//   let sut: EditAttachment;
//   let prisma: PrismaService;
//
//   beforeEach(async() => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         AttachmentModule,
//         ConfigModule,
//       ],
//     }).compile();
//
//     sut = module.get(EditAttachment);
//     prisma = module.get(PrismaService);
//
//     await prisma.attachment.deleteMany();
//   });
//
//   afterAll(async() => {
//     await prisma.attachment.deleteMany();
//   });
//
//   it('should be defined', () => {
//     expect(sut).toBeDefined();
//   });
// });
