import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { NfseClassificationKind } from '../../../domain/enums/nfse-classification-kind.enum';
import { DuplicateNfseClassificationError } from '../../../domain/errors/duplicate-nfse-classification.error';
import type { INfseClassificationDao } from '../../persistence/dao/nfse-classification-dao.interface';
import { ClassifyNfse } from './classify-nfse.service';
import { ClassifyNfseInputDto } from './dtos/classify-nfse.dto';

function makeValidInput(overrides: Partial<ClassifyNfseInputDto> = {}): ClassifyNfseInputDto {
  return {
    companyId: 10,
    items: [{ rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM }],
    ...overrides,
  };
}

describe('ClassifyNfse - Unit tests', () => {
  let sut: ClassifyNfse;
  let dao: INfseClassificationDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ClassifyNfse,
        { provide: TOKENS.NfseClassificationDao, useValue: createMock<INfseClassificationDao>() },
      ],
    }).compile();

    sut = module.get(ClassifyNfse);
    dao = module.get(TOKENS.NfseClassificationDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should upsert normalized series and return a success message', async() => {
    // Arrange
    const upsertSpy = jest.spyOn(dao, 'upsertMany').mockResolvedValue(undefined);
    const input = makeValidInput({
      items: [
        { rpsNumber: 41, rpsSeries: ' nfse ', kind: NfseClassificationKind.NFM },
        { rpsNumber: 42, rpsSeries: 'A', kind: NfseClassificationKind.NFS },
      ],
    });

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(upsertSpy).toHaveBeenCalledWith(10, [
      { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM },
      { rpsNumber: 42, rpsSeries: 'A', kind: NfseClassificationKind.NFS },
    ]);
    expect(result).toEqual({ message: 'NFS-e classificadas com sucesso' });
  });

  it('should throw DuplicateNfseClassificationError when the payload repeats an RPS', async() => {
    // Arrange
    const input = makeValidInput({
      items: [
        { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM },
        { rpsNumber: 41, rpsSeries: 'nfse', kind: NfseClassificationKind.NFS },
      ],
    });

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(DuplicateNfseClassificationError);
    expect(dao.upsertMany).not.toHaveBeenCalled();
  });
});
