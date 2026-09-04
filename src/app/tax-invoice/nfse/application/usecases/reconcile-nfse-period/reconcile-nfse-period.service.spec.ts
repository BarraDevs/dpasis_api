import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchErrorKind, NfsIssuedNoteDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseReconcileTargetDto } from '../../dtos/nfse-reconcile-target.dto';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import { ReconcileNfse } from '../reconcile-nfse/reconcile-nfse.service';
import { ReconcileNfsePeriod } from './reconcile-nfse-period.service';

function makeTarget(overrides: Partial<NfseReconcileTargetDto> = {}): NfseReconcileTargetDto {
  return {
    id: 1,
    companyId: 10,
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    status: NfseStatus.AWAITING_PROVIDER,
    ...overrides,
  };
}

function makeNote(rpsNumber: number, rpsSeries = 'NFSE'): NfsIssuedNoteDto {
  return {
    rpsNumber,
    rpsSeries,
    nfseNumber: String(9000 + rpsNumber),
    verificationCode: `V${rpsNumber}`,
    issueDate: '2026-09-03T10:00:00',
  };
}

const providerConfig = createMock<CompanyNfsConfigDto>({
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  municipalRegistration: '16895',
  vendorConfig: { municipioSlug: 'demonstracao' },
});

const company = createMock<CompanyDto>({ id: 10, document: '12345678000199' });

describe('ReconcileNfsePeriod - Unit tests', () => {
  let sut: ReconcileNfsePeriod;
  let nfseDao: INfseDao;
  let nfsGenerationGateway: INfsGenerationGateway;
  let reconcileNfse: ReconcileNfse;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReconcileNfsePeriod,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: ReconcileNfse, useValue: createMock<ReconcileNfse>() },
      ],
    }).compile();

    sut = module.get(ReconcileNfsePeriod);
    nfseDao = module.get(TOKENS.NfseDao);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    reconcileNfse = module.get(ReconcileNfse);

    jest.spyOn(module.get(FindCompanyNfsConfigByCompanyId), 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(module.get(FindCompanyById), 'execute').mockResolvedValue(company);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should query the local side by the São Paulo civil day', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([]);

    // Act
    await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert — 00:00 de 03/09 em SP é 03:00Z; o fim é exclusivo no dia seguinte.
    const [start, end] = jest.mocked(nfseDao.findPendingByPeriod).mock.calls[0];
    expect(start.toISOString()).toBe('2026-09-03T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-09-04T03:00:00.000Z');
  });

  it('should not call the provider when there is nothing pending locally', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([]);

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert
    expect(nfsGenerationGateway.listIssuedNfseByPeriod).not.toHaveBeenCalled();
    expect(result).toEqual({ checked: 0, corrected: 0, pagesRead: 0, divergences: [], dryRun: true });
  });

  it('should default to dryRun and correct nothing', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget()]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [makeNote(41)],
      endOfPages: true,
    });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert
    expect(result.dryRun).toBe(true);
    expect(result.corrected).toBe(0);
    expect(reconcileNfse.execute).not.toHaveBeenCalled();
    expect(result.divergences).toEqual([
      { nfseId: 1, rpsNumber: 41, rpsSeries: 'NFSE', status: NfseStatus.AWAITING_PROVIDER, foundAtProvider: true },
    ]);
  });

  it('should delegate the correction to the per-note reconciliation when writing', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget()]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [makeNote(41)],
      endOfPages: true,
    });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert — uma regra só decide o estado, e ela reconsulta pela chave natural antes de gravar.
    expect(reconcileNfse.execute).toHaveBeenCalledWith({ nfseId: 1 });
    expect(result.corrected).toBe(1);
  });

  it('should ignore provider notes with no local counterpart', async() => {
    // Arrange — a consulta devolve todas as notas do prestador, inclusive as emitidas pelo portal.
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget({ rpsNumber: 41 })]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [makeNote(900), makeNote(901), makeNote(41)],
      endOfPages: true,
    });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert
    expect(result.checked).toBe(1);
    expect(result.corrected).toBe(1);
    expect(result.divergences).toHaveLength(1);
  });

  it('should report a pending note the provider does not know as not found', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget({ rpsNumber: 41 })]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [makeNote(900)],
      endOfPages: true,
    });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert
    expect(result.divergences[0].foundAtProvider).toBe(false);
    expect(reconcileNfse.execute).not.toHaveBeenCalled();
  });

  it('should not match a note whose series differs', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget({ rpsNumber: 41, rpsSeries: 'A' })]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [makeNote(41, 'B'), makeNote(42, 'A')],
      endOfPages: true,
    });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert
    expect(result.divergences[0].foundAtProvider).toBe(false);
  });

  it('should keep paging until the provider signals the end', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget({ rpsNumber: 60 })]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod')
      .mockResolvedValueOnce({ notes: [makeNote(1)], endOfPages: false })
      .mockResolvedValueOnce({ notes: [makeNote(60)], endOfPages: true });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false });

    // Assert
    expect(result.pagesRead).toBe(2);
    expect(jest.mocked(nfsGenerationGateway.listIssuedNfseByPeriod).mock.calls.map(([arg]) => arg.page)).toEqual([1, 2]);
    expect(result.divergences[0].foundAtProvider).toBe(true);
  });

  it('should stop at the page ceiling when the provider never signals the end', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget()]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({ notes: [], endOfPages: false });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert
    expect(result.pagesRead).toBe(40);
  });

  it('should read one page set per company', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([
      makeTarget({ id: 1, companyId: 10, rpsNumber: 41 }),
      makeTarget({ id: 2, companyId: 10, rpsNumber: 42 }),
      makeTarget({ id: 3, companyId: 20, rpsNumber: 43 }),
    ]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({ notes: [], endOfPages: true });

    // Act
    const result = await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert — uma varredura por empresa, não uma por nota.
    expect(result.pagesRead).toBe(2);
    expect(result.checked).toBe(3);
  });

  it('should send the provider document from the company and the registration from the config', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget()]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({ notes: [], endOfPages: true });

    // Act
    await sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03' });

    // Assert
    expect(nfsGenerationGateway.listIssuedNfseByPeriod).toHaveBeenCalledWith(expect.objectContaining({
      startDate: '2026-09-03',
      endDate: '2026-09-03',
      providerDocument: '12345678000199',
      providerMunicipalRegistration: '16895',
    }));
  });

  it('should fail the period job when the provider returns a non-E212 error', async() => {
    // Arrange — engolir isso como fim de página deixa o cron D+1 "corrigir" 0 notas em silêncio.
    jest.spyOn(nfseDao, 'findPendingByPeriod').mockResolvedValue([makeTarget()]);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [],
      endOfPages: false,
      errors: [{ code: 'E135', message: 'Período consultado superior ao permitido', kind: NfsBatchErrorKind.BusinessRejection }],
    });

    // Act & Assert
    await expect(sut.execute({ startDate: '2026-09-03', endDate: '2026-09-03', dryRun: false }))
      .rejects.toThrow(ExternalApiError);
    expect(reconcileNfse.execute).not.toHaveBeenCalled();
  });
});
