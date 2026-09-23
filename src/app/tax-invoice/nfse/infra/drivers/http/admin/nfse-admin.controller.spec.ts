import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClassifyNfse } from '../../../../application/usecases/classify-nfse/classify-nfse.service';
import { ClassifyNfseInputDto, ClassifyNfseOutputDto } from '../../../../application/usecases/classify-nfse/dtos/classify-nfse.dto';
import { ListIssuedNfseFromProviderOutputDto } from '../../../../application/usecases/list-issued-nfse-from-provider/dtos/list-issued-nfse-from-provider.dto';
import { ListIssuedNfseFromProvider } from '../../../../application/usecases/list-issued-nfse-from-provider/list-issued-nfse-from-provider.service';
import { NfseClassificationKind } from '../../../../domain/enums/nfse-classification-kind.enum';
import { NfseAdminController } from './nfse-admin.controller';

describe('NfseAdminController - Unit tests', () => {
  let sut: NfseAdminController;
  let listIssuedNfseFromProvider: ListIssuedNfseFromProvider;
  let classifyNfse: ClassifyNfse;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfseAdminController],
      providers: [
        { provide: ListIssuedNfseFromProvider, useValue: createMock<ListIssuedNfseFromProvider>() },
        { provide: ClassifyNfse, useValue: createMock<ClassifyNfse>() },
      ],
    }).compile();

    sut = module.get(NfseAdminController);
    listIssuedNfseFromProvider = module.get(ListIssuedNfseFromProvider);
    classifyNfse = module.get(ClassifyNfse);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('issuedAtProvider', () => {
    it('should call listIssuedNfseFromProvider.execute with the query', async() => {
      // Arrange
      const queries = { companyId: 10, startDate: '2026-09-01', endDate: '2026-09-30', page: 1 };
      const output = createMock<ListIssuedNfseFromProviderOutputDto>();
      const spy = jest.spyOn(listIssuedNfseFromProvider, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.issuedAtProvider(queries);

      // Assert
      expect(result).toBe(output);
      expect(spy).toHaveBeenCalledWith(queries);
    });
  });

  describe('classify', () => {
    it('should call classifyNfse.execute with the body', async() => {
      // Arrange
      const body: ClassifyNfseInputDto = {
        companyId: 10,
        items: [{ rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM }],
      };
      const output = createMock<ClassifyNfseOutputDto>();
      const spy = jest.spyOn(classifyNfse, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.classify(body);

      // Assert
      expect(result).toBe(output);
      expect(spy).toHaveBeenCalledWith(body);
    });
  });
});
