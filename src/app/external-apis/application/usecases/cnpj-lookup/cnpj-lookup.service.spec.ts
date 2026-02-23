import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ICnpjLookupGateway } from 'src/infra/cnpj-lookup/cnpj-lookup.gateway';
import { CnpjLookupOutputDto } from 'src/infra/cnpj-lookup/dtos/cnpj-lookup.dto';
import { CnpjLookupInputDto } from './dtos/cnpj-lookup.dto';
import { CnpjLookup } from './cnpj-lookup.service';

describe('CnpjLookup - Unit tests', () => {
  let sut: CnpjLookup;
  let cnpjLookupGateway: ICnpjLookupGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CnpjLookup,
        {
          provide: TOKENS.CnpjLookupGateway,
          useValue: createMock<ICnpjLookupGateway>(),
        },
      ],
    }).compile();

    sut = module.get(CnpjLookup);
    cnpjLookupGateway = module.get(TOKENS.CnpjLookupGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call cnpjLookupGateway.lookup with cnpj from input', async() => {
      // Arrange
      const input = createMock<CnpjLookupInputDto>({ cnpj: '09.748.165/0001-10' });
      const output = createMock<CnpjLookupOutputDto>({
        fantasyName: 'Empresa Teste',
        companyName: 'Empresa Teste Ltda',
      });
      const lookupSpy = jest.spyOn(cnpjLookupGateway, 'lookup').mockResolvedValue(output);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual(output);
      expect(lookupSpy).toHaveBeenCalledWith(input.cnpj);
    });

    it('should return CnpjLookupOutputDto from gateway', async() => {
      // Arrange
      const input = createMock<CnpjLookupInputDto>({ cnpj: '33.000.167/0001-01' });
      const output = createMock<CnpjLookupOutputDto>({
        fantasyName: 'Banco do Brasil',
        companyName: 'Banco do Brasil S.A.',
      });
      jest.spyOn(cnpjLookupGateway, 'lookup').mockResolvedValue(output);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual(output);
      expect(result.fantasyName).toBe('Banco do Brasil');
      expect(result.companyName).toBe('Banco do Brasil S.A.');
    });
  });
});
