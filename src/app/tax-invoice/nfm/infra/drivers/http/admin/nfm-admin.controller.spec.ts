import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NfmDto, NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { CancelNfm } from 'src/app/tax-invoice/nfm/application/usecases/cancel-nfm/cancel-nfm.service';
import { CancelNfmInputDto, CancelNfmOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/cancel-nfm/dtos/cancel-nfm.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { FindGeneratedNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/find-generated-nfms.service';
import { FindGeneratedNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import { FindNfmById } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { NfmAdminController } from './nfm-admin.controller';

describe('NfmAdminController - Unit tests', () => {
  let sut: NfmAdminController;
  let findElegibleClients: FindElegibleClients;
  let findGeneratedNfms: FindGeneratedNfms;
  let findNfmById: FindNfmById;
  let saveElegibleNfms: SaveElegibleNfms;
  let cancelNfm: CancelNfm;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfmAdminController],
      providers: [
        { provide: FindElegibleClients, useValue: createMock<FindElegibleClients>() },
        { provide: FindGeneratedNfms, useValue: createMock<FindGeneratedNfms>() },
        { provide: FindNfmById, useValue: createMock<FindNfmById>() },
        { provide: SaveElegibleNfms, useValue: createMock<SaveElegibleNfms>() },
        { provide: CancelNfm, useValue: createMock<CancelNfm>() },
      ],
    }).compile();

    sut = module.get(NfmAdminController);
    findElegibleClients = module.get(FindElegibleClients);
    findGeneratedNfms = module.get(FindGeneratedNfms);
    findNfmById = module.get(FindNfmById);
    saveElegibleNfms = module.get(SaveElegibleNfms);
    cancelNfm = module.get(CancelNfm);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findElegible', () => {
    it('should call findElegibleClients.execute', async() => {
      // Arrange
      const output = [createMock<NfmDto>()];
      const findSpy = jest.spyOn(findElegibleClients, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findElegible();

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith();
    });
  });

  describe('findAll', () => {
    it('should call findGeneratedNfms.execute with queries', async() => {
      // Arrange
      const queries: FindGeneratedNfmsQueryDto = {
        dateStart: '2026-08-01',
        dateEnd: '2026-08-31',
        page: 1,
        size: 10,
      };
      const output = createMock<IPagination<NfmWithNfseDto>>();
      const findSpy = jest.spyOn(findGeneratedNfms, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findNfmById.execute with params.id', async() => {
      // Arrange
      const params = { id: 42 } as Params;
      const output = createMock<NfmWithNfseDto>({ id: 42 });
      const findSpy = jest.spyOn(findNfmById, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith(42);
    });
  });

  describe('saveElegible', () => {
    it('should call saveElegibleNfms.execute', async() => {
      // Arrange
      const output = createMock<SaveElegibleNfmsOutputDto>();
      const saveSpy = jest.spyOn(saveElegibleNfms, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.saveElegible();

      // Assert
      expect(result).toEqual(output);
      expect(saveSpy).toHaveBeenCalledWith();
    });
  });

  describe('cancel', () => {
    it('should call cancelNfm.execute with params.id and body', async() => {
      // Arrange
      const params = { id: 42 } as Params;
      const body = createMock<CancelNfmInputDto>({ cancelReasonCode: 2 });
      const output = createMock<CancelNfmOutputDto>();
      const cancelSpy = jest.spyOn(cancelNfm, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.cancel(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(cancelSpy).toHaveBeenCalledWith(42, body);
    });
  });
});
