import { Test } from '@nestjs/testing';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ShipperController } from './shipper.controller';

describe('ShipperController', () => {
  let sut: ShipperController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ShipperModule,
      ],
    }).compile();

    sut = module.get(ShipperController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
