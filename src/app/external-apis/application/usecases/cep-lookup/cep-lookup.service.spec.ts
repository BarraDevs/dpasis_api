import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ICepLookupGateway } from 'src/infra/cep-lookup/cep-lookup.gateway';
import { CepLookupOutputDto } from 'src/infra/cep-lookup/dtos/cep-lookup.dto';
import { CepLookup } from './cep-lookup.service';
import { CepLookupInputDto } from './dtos/cep-lookup.dto';

describe('CepLookup - Unit tests', () => {
  let sut: CepLookup;
  let cepLookupGateway: ICepLookupGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CepLookup,
        {
          provide: TOKENS.CepLookupGateway,
          useValue: createMock<ICepLookupGateway>(),
        },
      ],
    }).compile();

    sut = module.get(CepLookup);
    cepLookupGateway = module.get(TOKENS.CepLookupGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call cepLookupGateway.lookup with zipCode from input', async() => {
      // Arrange
      const input = createMock<CepLookupInputDto>({ zipCode: '01310100' });
      const output = createMock<CepLookupOutputDto>();
      const lookupSpy = jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(output);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual(output);
      expect(lookupSpy).toHaveBeenCalledWith(input.zipCode);
    });

    it('should return CepLookupOutputDto from gateway', async() => {
      // Arrange
      const input = createMock<CepLookupInputDto>({ zipCode: '20040020' });
      const output = createMock<CepLookupOutputDto>({
        zipCode: '20040020',
        street: 'Rua do Ouvidor',
        complement: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      });
      jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(output);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual(output);
    });
  });
});
