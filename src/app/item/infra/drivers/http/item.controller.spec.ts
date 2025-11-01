import { Test } from '@nestjs/testing';
import { ItemModule } from 'src/app/item/item.module';
import { ItemController } from './item.controller';

describe('ItemController', () => {
  let sut: ItemController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ItemModule,
      ],
    }).compile();

    sut = module.get(ItemController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
