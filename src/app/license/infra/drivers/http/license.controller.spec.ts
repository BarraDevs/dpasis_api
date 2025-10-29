import { Test } from '@nestjs/testing';
import { LicenseModule } from 'src/app/license/license.module';
import { LicenseController } from './license.controller';

describe('LicenseController', () => {
  let sut: LicenseController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        LicenseModule,
      ],
    }).compile();

    sut = module.get(LicenseController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
