import { Test } from '@nestjs/testing';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { SupplierController } from './supplier.controller';

describe('SupplierController', () => {
  let sut: SupplierController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SupplierModule,
      ],
    }).compile();

    sut = module.get(SupplierController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
