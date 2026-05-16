import { Test } from '@nestjs/testing';
import { NfmAdminController } from './nfm-admin.controller';
import { NfmModule } from 'src/app/tax-invoice/nfm/nfm.module';

describe('NfmAdminController', () => {
  let sut: NfmAdminController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        NfmModule,
      ],
    }).compile();

    sut = module.get(NfmAdminController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
