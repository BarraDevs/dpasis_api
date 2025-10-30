import { Test } from '@nestjs/testing';
import { AttachmentModule } from 'src/app/attachment/attachment.module';
import { AttachmentController } from './attachment.controller';

describe('AttachmentController', () => {
  let sut: AttachmentController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AttachmentModule,
      ],
    }).compile();

    sut = module.get(AttachmentController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
