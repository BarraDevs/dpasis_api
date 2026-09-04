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
import { FindNfmProviderStatus } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-provider-status/find-nfm-provider-status.service';
import { FindNfmProviderStatusOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-provider-status/dtos/find-nfm-provider-status.dto';
import { ReconcileNfm } from 'src/app/tax-invoice/nfm/application/usecases/reconcile-nfm/reconcile-nfm.service';
import { ReconcileNfmInputDto, ReconcileNfmOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/reconcile-nfm/dtos/reconcile-nfm.dto';
import { ReissueNfm } from 'src/app/tax-invoice/nfm/application/usecases/reissue-nfm/reissue-nfm.service';
import { ReissueNfmInputDto, ReissueNfmOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/reissue-nfm/dtos/reissue-nfm.dto';
import { ReconcileNfsePeriod } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse-period/reconcile-nfse-period.service';
import {
  ReconcileNfsePeriodInputDto,
  ReconcileNfsePeriodOutputDto,
} from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse-period/dtos/reconcile-nfse-period.dto';
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
  let findNfmProviderStatus: FindNfmProviderStatus;
  let reconcileNfm: ReconcileNfm;
  let reissueNfm: ReissueNfm;
  let reconcileNfsePeriod: ReconcileNfsePeriod;

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
        { provide: FindNfmProviderStatus, useValue: createMock<FindNfmProviderStatus>() },
        { provide: ReconcileNfm, useValue: createMock<ReconcileNfm>() },
        { provide: ReissueNfm, useValue: createMock<ReissueNfm>() },
        { provide: ReconcileNfsePeriod, useValue: createMock<ReconcileNfsePeriod>() },
      ],
    }).compile();

    sut = module.get(NfmAdminController);
    findElegibleClients = module.get(FindElegibleClients);
    findGeneratedNfms = module.get(FindGeneratedNfms);
    findNfmById = module.get(FindNfmById);
    saveElegibleNfms = module.get(SaveElegibleNfms);
    cancelNfm = module.get(CancelNfm);
    findNfmProviderStatus = module.get(FindNfmProviderStatus);
    reconcileNfm = module.get(ReconcileNfm);
    reissueNfm = module.get(ReissueNfm);
    reconcileNfsePeriod = module.get(ReconcileNfsePeriod);
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
  describe('providerStatus', () => {
    it('should call findNfmProviderStatus.execute with params.id', async() => {
      // Arrange
      const output = createMock<FindNfmProviderStatusOutputDto>();
      const spy = jest.spyOn(findNfmProviderStatus, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.providerStatus({ id: 5 } as Params);

      // Assert
      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(5);
    });
  });

  describe('reconcile', () => {
    it('should call reconcileNfm.execute with params.id and body', async() => {
      // Arrange
      const body = { reason: 'nota parada desde o incidente' } as ReconcileNfmInputDto;
      const output = createMock<ReconcileNfmOutputDto>();
      const spy = jest.spyOn(reconcileNfm, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.reconcile({ id: 5 } as Params, body);

      // Assert
      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(5, body);
    });
  });

  describe('reissue', () => {
    it('should call reissueNfm.execute with params.id and body', async() => {
      // Arrange
      const body = { reason: 'cadastro do tomador corrigido', confirm: true } as ReissueNfmInputDto;
      const output = createMock<ReissueNfmOutputDto>();
      const spy = jest.spyOn(reissueNfm, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.reissue({ id: 5 } as Params, body);

      // Assert
      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(5, body);
    });
  });

  describe('reconcilePeriod', () => {
    it('should call reconcileNfsePeriod.execute with the body', async() => {
      // Arrange
      const body = { startDate: '2026-09-03', endDate: '2026-09-03' } as ReconcileNfsePeriodInputDto;
      const output = createMock<ReconcileNfsePeriodOutputDto>();
      const spy = jest.spyOn(reconcileNfsePeriod, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.reconcilePeriod(body);

      // Assert
      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(body);
    });
  });
});
