import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { TOKENS } from 'src/core/di/token';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfsProviderNotConfiguredError } from '../../../domain/errors/nfs-provider-not-configured.error';
import { NfsProviderConfigDto } from '../../dtos/nfs-provider-config.dto';
import type { INfsProviderConfigDao } from '../../persistence/dao/nfs-provider-config-dao.interface';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseRpsSequenceRepository } from '../../persistence/repository/nfse-rps-sequence-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { IssueNfse } from './issue-nfse.service';
import { IssueNfseInputDto } from './dtos/issue-nfse.dto';

function makeIssueNfseInput(overrides: Partial<IssueNfseInputDto> = {}): IssueNfseInputDto {
  return {
    companyId: 1,
    clientId: 1,
    simpleNationalOptant: false,
    fiscalIncentive: false,
    service: {
      serviceListItemCode: '01.07',
      nbsCode: '112731375',
      description: 'Desenvolvimento de sistema',
      serviceMunicipalCodeIbge: '3529401',
      issExigibility: 1,
      issWithheld: false,
      servicesValue: 1000,
    },
    ...overrides,
  };
}

describe('IssueNfse - Unit tests', () => {
  let sut: IssueNfse;
  let providerConfigDao: INfsProviderConfigDao;
  let findCompanyById: FindCompanyById;
  let findClientById: FindClientById;
  let nfseDao: INfseDao;
  let rpsSequenceRepository: INfseRpsSequenceRepository;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        IssueNfse,
        { provide: TOKENS.NfsProviderConfigDao, useValue: createMock<INfsProviderConfigDao>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: FindClientById, useValue: createMock<FindClientById>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfseRpsSequenceRepository, useValue: createMock<INfseRpsSequenceRepository>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(IssueNfse);
    providerConfigDao = module.get(TOKENS.NfsProviderConfigDao);
    findCompanyById = module.get(FindCompanyById);
    findClientById = module.get(FindClientById);
    nfseDao = module.get(TOKENS.NfseDao);
    rpsSequenceRepository = module.get(TOKENS.NfseRpsSequenceRepository);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfsProviderNotConfiguredError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(providerConfigDao, 'findByCompanyId').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow(NfsProviderNotConfiguredError);
  });

  it('should persist a PENDING nfse, reserve a rps number and enqueue the issue-batch job', async() => {
    // Arrange
    const providerConfig = createMock<NfsProviderConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    jest.spyOn(providerConfigDao, 'findByCompanyId').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({ document: '98765432000188', companyName: 'Cliente LTDA' }));
    jest.spyOn(rpsSequenceRepository, 'getAndIncrement').mockResolvedValue(7);
    jest.spyOn(nfseDao, 'save').mockResolvedValue(42);

    // Act
    const result = await sut.execute(makeIssueNfseInput());

    // Assert
    expect(rpsSequenceRepository.getAndIncrement).toHaveBeenCalledWith(1);
    expect(nfseDao.save).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 1,
      clientId: 1,
      rpsNumber: 7,
      rpsSeries: 'NFSE',
    }));
    expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 42 });
    expect(result).toEqual({ id: 42, status: NfseStatus.PENDING });
  });
});
