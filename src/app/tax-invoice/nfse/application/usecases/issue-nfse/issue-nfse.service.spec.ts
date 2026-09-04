import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientAddressDto } from 'src/app/client/client-address/application/dtos/client-address.dto';
import { FindClientAddressByClientIdAndType } from 'src/app/client/client-address/application/usecases/find-client-address-by-client-id-and-type/find-client-address-by-client-id-and-type.service';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { ClientAddressForNfseNotFoundError } from '../../../domain/errors/client-address-for-nfse-not-found.error';
import type { INfseRepository, ReserveNfseInput } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { IssueNfseInputDto } from './dtos/issue-nfse.dto';
import { IssueNfse } from './issue-nfse.service';

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
    city: 'São Paulo',
    cityCodeIbge: '3550308',
    state: 'SP',
    zipCode: '01310-100',
    ...overrides,
  });
}

function makeInvoiceConfig(overrides: Partial<ClientInvoiceConfigDto> = {}): ClientInvoiceConfigDto {
  return createMock<ClientInvoiceConfigDto>({
    type: ClientInvoiceConfigType.MONTHLY,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    dueMonth: null,
    deadlineDays: null,
    ...overrides,
  });
}

describe('IssueNfse - Unit tests', () => {
  let sut: IssueNfse;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let findCompanyById: FindCompanyById;
  let findClientById: FindClientById;
  let findClientAddressByClientIdAndType: FindClientAddressByClientIdAndType;
  let findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId;
  let nfseRepository: INfseRepository;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        IssueNfse,
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: FindClientById, useValue: createMock<FindClientById>() },
        { provide: FindClientAddressByClientIdAndType, useValue: createMock<FindClientAddressByClientIdAndType>() },
        { provide: FindClientInvoiceConfigByClientId, useValue: createMock<FindClientInvoiceConfigByClientId>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(IssueNfse);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
    findCompanyById = module.get(FindCompanyById);
    findClientById = module.get(FindClientById);
    findClientAddressByClientIdAndType = module.get(FindClientAddressByClientIdAndType);
    findClientInvoiceConfigByClientId = module.get(FindClientInvoiceConfigByClientId);
    nfseRepository = module.get(TOKENS.NfseRepository);
    queueProducer = module.get(TOKENS.NfseQueueProducer);

    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(makeInvoiceConfig());
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
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({
      document: '98765432000188',
      companyName: 'Cliente LTDA',
      type: ClientType.PJ,
    }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute').mockResolvedValue(makeClientAddress({ cityCodeIbge: '   ' }));

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow(ClientAddressForNfseNotFoundError);
  });

  it('should throw ClientAddressForNfseNotFoundError when the client has no billing or main address with cityCodeIbge', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({
      document: '98765432000188',
      companyName: 'Cliente LTDA',
      type: ClientType.PJ,
    }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow(ClientAddressForNfseNotFoundError);
  });

  it('should persist a PENDING nfse with taker address and bankPayment snapshot, reserve a rps number and enqueue the issue-batch job', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    const address = makeClientAddress();
    const invoiceConfig = makeInvoiceConfig({
      type: ClientInvoiceConfigType.MONTHLY,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 10,
    });
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({
      document: '98765432000188',
      companyName: 'Cliente LTDA',
      type: ClientType.PJ,
    }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute').mockResolvedValue(address);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(invoiceConfig);
    jest.spyOn(nfseRepository, 'reserve').mockResolvedValue({ nfseId: 42, rpsNumber: 7, outboxId: 5 });

    // Act
    const result = await sut.execute(makeIssueNfseInput({ nfmId: 9 }));

    // Assert
    expect(findClientAddressByClientIdAndType.execute).toHaveBeenCalledWith(1, ClientAddressType.BILLING);
    expect(findClientInvoiceConfigByClientId.execute).toHaveBeenCalledWith(1);
    expect(nfseRepository.reserve).toHaveBeenCalledTimes(1);
    const reservation = (nfseRepository.reserve as jest.Mock).mock.calls[0][0] as ReserveNfseInput;
    expect(reservation).toMatchObject({
      companyId: 1,
      clientId: 1,
      rpsSeries: 'NFSE',
      nfmId: 9,
      jobName: JobName.IssueNfseBatch,
      data: expect.objectContaining({
        clientType: ClientType.PJ,
        takerAddress: {
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          cityCodeIbge: address.cityCodeIbge,
          state: address.state,
          zipCode: address.zipCode,
        },
        bankPayment: expect.objectContaining({
          invoiceType: ClientInvoiceConfigType.MONTHLY,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 10,
          dueMonth: null,
          deadlineDays: null,
          referenceMonth: expect.any(Number),
          referenceYear: expect.any(Number),
        }),
      }),
    });
    expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 42 });
    expect(nfseRepository.markOutboxDispatched).toHaveBeenCalledWith(5);
    expect(result).toEqual({ id: 42, status: NfseStatus.PENDING });
  });

  it('should leave the outbox row undispatched when enqueuing fails', async() => {
    // Arrange
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute')
      .mockResolvedValue(createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' }));
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({
      document: '98765432000188',
      companyName: 'Cliente LTDA',
      type: ClientType.PJ,
    }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute').mockResolvedValue(makeClientAddress());
    jest.spyOn(nfseRepository, 'reserve').mockResolvedValue({ nfseId: 42, rpsNumber: 7, outboxId: 5 });
    jest.spyOn(queueProducer, 'addIssueBatchJob').mockRejectedValue(new Error('redis down'));

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput())).rejects.toThrow('redis down');
    expect(nfseRepository.markOutboxDispatched).not.toHaveBeenCalled();
  });

  it('should fallback to MAIN address when BILLING is not found', async() => {
    // Arrange
    const providerConfig = createMock<CompanyNfsConfigDto>({ serieRps: 'NFSE', municipalRegistration: '12345' });
    const mainAddress = makeClientAddress({ type: ClientAddressType.MAIN });
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ document: '12345678000199' }));
    jest.spyOn(findClientById, 'execute').mockResolvedValue(createMock<ClientDto>({
      document: '98765432000188',
      companyName: 'Cliente LTDA',
      type: ClientType.PF,
    }));
    jest.spyOn(findClientAddressByClientIdAndType, 'execute')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mainAddress);
    jest.spyOn(nfseRepository, 'reserve').mockResolvedValue({ nfseId: 42, rpsNumber: 7, outboxId: 5 });

    // Act
    await sut.execute(makeIssueNfseInput());

    // Assert
    expect(findClientAddressByClientIdAndType.execute).toHaveBeenNthCalledWith(1, 1, ClientAddressType.BILLING);
    expect(findClientAddressByClientIdAndType.execute).toHaveBeenNthCalledWith(2, 1, ClientAddressType.MAIN);
  });
});
