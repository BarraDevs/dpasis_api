import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CepLookup } from 'src/app/external-apis/application/usecases/cep-lookup/cep-lookup.service';
import { CepLookupInputDto } from 'src/app/external-apis/application/usecases/cep-lookup/dtos/cep-lookup.dto';
import { CnpjLookup } from 'src/app/external-apis/application/usecases/cnpj-lookup/cnpj-lookup.service';
import { CnpjLookupInputDto } from 'src/app/external-apis/application/usecases/cnpj-lookup/dtos/cnpj-lookup.dto';
import { ExternalApisModule } from 'src/app/external-apis/external-apis.module';
import { CepLookupOutputDto } from 'src/infra/cep-lookup/dtos/cep-lookup.dto';
import { CnpjLookupOutputDto } from 'src/infra/cnpj-lookup/dtos/cnpj-lookup.dto';
import { ExternalApisController } from './external-apis.controller';

describe('ExternalApisController - Unit tests', () => {
  let sut: ExternalApisController;
  let cepLookup: CepLookup;
  let cnpjLookup: CnpjLookup;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [ExternalApisModule],
      controllers: [ExternalApisController],
      providers: [
        { provide: CepLookup, useValue: createMock<CepLookup>() },
        { provide: CnpjLookup, useValue: createMock<CnpjLookup>() },
      ],
    }).compile();

    sut = module.get(ExternalApisController);
    cepLookup = module.get(CepLookup);
    cnpjLookup = module.get(CnpjLookup);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('lookupCep', () => {
    it('should call cepLookup.execute with body', async() => {
      // Arrange
      const body = createMock<CepLookupInputDto>();
      const output = createMock<CepLookupOutputDto>();
      const lookupCepSpy = jest.spyOn(cepLookup, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.lookupCep(body);

      // Assert
      expect(result).toEqual(output);
      expect(lookupCepSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('lookupCnpj', () => {
    it('should call cnpjLookup.execute with body', async() => {
      // Arrange
      const body = createMock<CnpjLookupInputDto>();
      const output = createMock<CnpjLookupOutputDto>();
      const lookupCnpjSpy = jest.spyOn(cnpjLookup, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.lookupCnpj(body);

      // Assert
      expect(result).toEqual(output);
      expect(lookupCnpjSpy).toHaveBeenCalledWith(body);
    });
  });
});
