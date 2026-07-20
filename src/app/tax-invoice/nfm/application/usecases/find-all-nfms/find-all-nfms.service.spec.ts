import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { NfDto } from 'src/infra/nf-generation/dtos/nf.dto';
import type { INfGenerationGateway } from 'src/infra/nf-generation/nf-generation.gateway';
import { FindAllNfmsQueryDto } from './dtos/find-all-nfms.dto';
import { FindAllNfms } from './find-all-nfms.service';

describe('FindAllNfms - Unit tests', () => {
  let sut: FindAllNfms;
  let nfGenerationGateway: INfGenerationGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllNfms,
        {
          provide: TOKENS.NfGenerationGateway,
          useValue: createMock<INfGenerationGateway>(),
        },
      ],
    }).compile();

    sut = module.get(FindAllNfms);
    nfGenerationGateway = module.get(TOKENS.NfGenerationGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    it('should call nfGenerationGateway.findAll with queries', async() => {
      // Arrange
      const queries = createMock<FindAllNfmsQueryDto>({ page: 1, limit: 10 });
      const output = [createMock<NfDto>()];
      const findAllSpy = jest.spyOn(nfGenerationGateway, 'findAll').mockResolvedValue(output);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });
});
