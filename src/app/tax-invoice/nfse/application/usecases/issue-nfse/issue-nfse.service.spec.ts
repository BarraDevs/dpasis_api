import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientAddressDto } from 'src/app/client/client-address/application/dtos/client-address.dto';
import { FindClientAddressByClientIdAndType } from 'src/app/client/client-address/application/usecases/find-client-address-by-client-id-and-type/find-client-address-by-client-id-and-type.service';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { TOKENS } from 'src/core/di/token';
import { ClientAddressForNfseNotFoundError } from '../../../domain/errors/client-address-for-nfse-not-found.error';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
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
      nbsCode: '1.1501.30.00',
      indopCode: '050101',
      description: 'Desenvolvimento de sistema',
      serviceMunicipalCodeIbge: '3529401',
      issExigibility: 1,
      issWithheld: false,
      servicesValue: 1000,
    },
    ...overrides,
  };
}

function makeClientAddress(overrides: Partial<ClientAddressDto> = {}): ClientAddressDto {
  return createMock<ClientAddressDto>({
    type: ClientAddressType.BILLING,
    street: 'Av. Paulista',
    number: '500',
    complement: 'Sala 301',
    neighborhood: 'Bela Vista',
    cityCodeIbge: '3550308',
    state: 'SP',
    zipCode: '01310-100',
    ...overrides,
  });
}

describe('IssueNfse - Unit tests', () => {
  let sut: IssueNfse;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let findCompanyById: FindCompanyById;
  let findClientById: FindClientById;
  let findClientAddressByClientIdAndType: FindClientAddressByClientIdAndType;
  let nfseDao: INfseDao;
  let rpsSequenceRepository: INfseRpsSequenceRepository;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        IssueNfse,
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: FindClientById, useValue: createMock<FindClientById>() },
        { provide: FindClientAddressByClientIdAndType, useValue: createMock<FindClientAddressByClientIdAndType>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfseRpsSequenceRepository, useValue: createMock<INfseRpsSequenceRepository>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(IssueNfse);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
    findCompanyById = module.get(FindCompanyById);
    findClientById = module.get(FindClientById);
    findClientAddressByClientIdAndType = module.get(FindClientAddressByClientIdAndType);
    nfseDao = module.get(TOKENS.NfseDao);
    rpsSequenceRepository = module.get(TOKENS.NfseRpsSequenceRepository);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should throw ClientAddressForNfseNotFoundError when billing address has blank cityCodeIbge', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({ document: '98765432000188', companyName: 'Cliente LTDA' }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute').mockResolvedValue(makeClientAddress({ cityCodeIbge: '   ' }));

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow(ClientAddressForNfseNotFoundError);
  });

  it('should throw ClientAddressForNfseNotFoundError when the client has no billing or main address with cityCodeIbge', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({ document: '98765432000188', companyName: 'Cliente LTDA' }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow(ClientAddressForNfseNotFoundError);
  });

  it('should persist a PENDING nfse with taker address, reserve a rps number and enqueue the issue-batch job', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    const address = makeClientAddress();
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({ document: '98765432000188', companyName: 'Cliente LTDA' }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute').mockResolvedValue(address);
    jest.spyOn(rpsSequenceRepository, 'getAndIncrement').mockResolvedValue(7);
    jest.spyOn(nfseDao, 'save').mockResolvedValue(42);

    // Act
    const result = await sut.execute(makeIssueNfseInput());

    // Assert
    expect(findClientAddressByClientIdAndType.execute).toHaveBeenCalledWith(1, ClientAddressType.BILLING);
    expect(rpsSequenceRepository.getAndIncrement).toHaveBeenCalledWith(1);
    expect(nfseDao.save).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 1,
      clientId: 1,
      rpsNumber: 7,
      rpsSeries: 'NFSE',
      data: expect.objectContaining({
        takerAddress: {
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          cityCodeIbge: address.cityCodeIbge,
          state: address.state,
          zipCode: address.zipCode,
        },
      }),
    }));
    expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 42 });
    expect(result).toEqual({ id: 42, status: NfseStatus.PENDING });
  });

  it('should fallback to MAIN address when BILLING is not found', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    const mainAddress = makeClientAddress({ type: ClientAddressType.MAIN });
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({ document: '98765432000188', companyName: 'Cliente LTDA' }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mainAddress);
    jest.spyOn(rpsSequenceRepository, 'getAndIncrement').mockResolvedValue(7);
    jest.spyOn(nfseDao, 'save').mockResolvedValue(42);

    // Act
    await sut.execute(makeIssueNfseInput());

    // Assert
    expect(findClientAddressByClientIdAndType.execute).toHaveBeenNthCalledWith(1, 1, ClientAddressType.BILLING);
    expect(findClientAddressByClientIdAndType.execute).toHaveBeenNthCalledWith(2, 1, ClientAddressType.MAIN);
  });
});
