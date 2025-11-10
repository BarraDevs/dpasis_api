import { Test } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company.module';
import { CompanyController } from './company.controller';

describe('CompanyController', () => {
  let sut: CompanyController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        CompanyModule,
      ],
    }).compile();

    sut = module.get(CompanyController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
