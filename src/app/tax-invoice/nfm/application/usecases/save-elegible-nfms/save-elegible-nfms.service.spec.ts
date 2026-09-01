import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import { IssueNfse } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import { NfmDto } from '../../dtos/nfm.dto';
import type { INfmCronRunDao } from '../../persistence/dao/nfm-cron-run-dao.interface';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { FindElegibleClients } from '../find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfms } from './save-elegible-nfms.service';

function makeCnaeNbsIndop(id = 1) {
  return {
    id,
    active: true,
    serviceListItemCode: '01.07',
    cnae: { id: 1, code: '6209-1/00', description: 'CNAE' },
    nbs: { id: 1, code: '1.1501.30.00', description: 'NBS' },
    indop: { id: 1, code: '050101', description: 'INDOP' },
  } as NfmDto['clientItems'][number]['cnaeNbsIndop'];
}

function makeNfmDto(overrides: Partial<NfmDto> = {}): NfmDto {
  const base: NfmDto = {
    client: {
      id: 1,
      type: 'PJ',
      document: '00000000000101',
      ie: null,
      parentClientId: null,
      isSubClient: false,
      attendanceId: null,
      maintenanceTicketId: null,
      companyName: 'Empresa Teste',
      fantasyName: null,
      socialName: null,
      domain: null,
      headquarters: 'Matriz',
      invoiceType: 'Contrato',
      generateInvoice: true,
      active: true,
      honorific: null,
      group: { id: 1, name: 'Grupo' },
      resale: { id: 1, name: 'Revenda' },
      company: { id: 1, name: 'Empresa' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clientInvoiceConfig: {
      id: 1,
      clientId: 1,
      generateNf: true,
      type: 'MONTHLY' as NfmDto['clientInvoiceConfig']['type'],
      emissionDay: 1,
      dueDateType: 'DUE_DATE' as NfmDto['clientInvoiceConfig']['dueDateType'],
      dueDateDay: 4,
      dueMonth: null,
      deadlineDays: null,
      months: [],
      billingAddress: {
        id: 1,
        clientId: 1,
        type: 'Cobrança',
        zipCode: '00000-000',
        street: 'Rua',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      bank: {
        id: 1,
        drawer: 'D',
        wallet: '1',
        account: '1',
        agency: '1',
        bankCode: '001',
        bankName: 'Banco',
        paymentLocation: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      autoProtestBoleto: false,
      issWithheld: false,
      message: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clientItems: [
      {
        id: 1,
        clientId: 1,
        description: 'Item 1',
        quantity: 2,
        unitValueInCents: 5000,
        totalValueInCents: 10000,
        active: true,
        cnaeNbsIndop: makeCnaeNbsIndop(1),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  return { ...base, ...overrides };
}

function makeProviderConfig(): CompanyNfsConfigDto {
  return {
    id: 1,
    companyId: 1,
    vendor: 'giss',
    municipalRegistration: '123',
    municipalCodeIbge: '3529401',
    serieRps: 'NFSE',
    environment: 'DEMONSTRATION',
    certFilePath: '/certs/a.pfx',
    certPasswordEnvVar: 'PWD',
    vendorConfig: { municipioSlug: 'demonstracao' },
    simpleNationalOptant: false,
    fiscalIncentive: false,
    issRate: 0.05,
    issExigibility: 1,
    municipalTaxCode: '010700',
  };
}

function makePersistedNfm(overrides: { id?: number; withNfse?: boolean } = {}): Nfm {
  const now = new Date();
  const entity = NfmFactory.load({
    id: overrides.id ?? 10,
    clientId: 1,
    clientDocument: '00000000000101',
    companyName: 'Empresa Teste',
    referenceMonth: now.getMonth() + 1,
    referenceYear: now.getFullYear(),
    totalValueInCents: 10000,
    cnaeNbsIndopId: 1,
    data: {},
    nfse: null,
  });

  if (overrides.withNfse) {
    entity.linkNfse(NfseFactory.load({
      id: 20,
      companyId: 1,
      clientId: 1,
      rpsNumber: 1,
      rpsSeries: '1',
      status: NfseStatus.PENDING,
      batchProtocol: null,
      nfseNumber: null,
      verificationCode: null,
      issuedAt: null,
      errorMessage: null,
      canceledAt: null,
      cancelReasonCode: null,
      bankPaymentProvider: null,
      bankPaymentRequestCode: null,
      data: {},
    }));
  }

  return entity;
}

function makeIssuedNfseEntity(id: number) {
  return NfseFactory.load({
    id,
    companyId: 1,
    clientId: 1,
    rpsNumber: 1,
    rpsSeries: '1',
    status: NfseStatus.PENDING,
    batchProtocol: null,
    nfseNumber: null,
    verificationCode: null,
    issuedAt: null,
    errorMessage: null,
    canceledAt: null,
    cancelReasonCode: null,
    bankPaymentProvider: null,
    bankPaymentRequestCode: null,
    data: {},
  });
}

describe('SaveElegibleNfms - Unit tests', () => {
  let sut: SaveElegibleNfms;
  let findElegibleClients: jest.Mocked<FindElegibleClients>;
  let nfmRepository: jest.Mocked<INfmRepository>;
  let nfseRepository: jest.Mocked<INfseRepository>;
  let nfmCronRunDao: jest.Mocked<INfmCronRunDao>;
  let findCompanyNfsConfigByCompanyId: jest.Mocked<FindCompanyNfsConfigByCompanyId>;
  let issueNfse: jest.Mocked<IssueNfse>;

  beforeEach(async() => {
    findElegibleClients = createMock<FindElegibleClients>();
    nfmRepository = createMock<INfmRepository>();
    nfseRepository = createMock<INfseRepository>();
    nfmCronRunDao = createMock<INfmCronRunDao>();
    findCompanyNfsConfigByCompanyId = createMock<FindCompanyNfsConfigByCompanyId>();
    issueNfse = createMock<IssueNfse>();

    const module = await Test.createTestingModule({
      providers: [
        SaveElegibleNfms,
        { provide: FindElegibleClients, useValue: findElegibleClients },
        { provide: TOKENS.NfmRepository, useValue: nfmRepository },
        { provide: TOKENS.NfseRepository, useValue: nfseRepository },
        { provide: TOKENS.NfmCronRunDao, useValue: nfmCronRunDao },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: findCompanyNfsConfigByCompanyId },
        { provide: IssueNfse, useValue: issueNfse },
      ],
    }).compile();

    sut = module.get(SaveElegibleNfms);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return zeros when no elegible clients', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0, skipped: 0, failed: 0, errors: [] });
    expect(nfmRepository.save).not.toHaveBeenCalled();
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('should create nfm, issue nfse and link nfse', async() => {
    // Arrange
    const nfm = makeNfmDto();
    findElegibleClients.execute.mockResolvedValue([nfm]);
    nfmRepository.findByClientReferenceAndCnae.mockResolvedValue(null);
    nfmRepository.save.mockResolvedValue(99);
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 55, status: NfseStatus.PENDING });
    nfseRepository.findById.mockResolvedValue(makeIssuedNfseEntity(55));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 1, skipped: 0, failed: 0, errors: [] });
    expect(nfmRepository.save).toHaveBeenCalledWith(expect.any(Nfm));
    expect(issueNfse.execute).toHaveBeenCalledTimes(1);
    expect(nfseRepository.findById).toHaveBeenCalledWith(55);
    const edited = nfmRepository.edit.mock.calls[0][0] as Nfm;
    expect(edited.props.id).toBe(99);
    expect(edited.props.nfse?.props.id).toBe(55);
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('should skip when nfm already has nfse', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmRepository.findByClientReferenceAndCnae.mockResolvedValue(
      makePersistedNfm({ id: 10, withNfse: true }),
    );

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0, skipped: 1, failed: 0, errors: [] });
    expect(nfmRepository.save).not.toHaveBeenCalled();
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 0,
      skipped: 1,
      failed: 0,
      errors: [],
    });
  });

  it('should retry issue when nfm exists without nfse', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmRepository.findByClientReferenceAndCnae.mockResolvedValue(
      makePersistedNfm({ id: 10, withNfse: false }),
    );
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 77, status: NfseStatus.PENDING });
    nfseRepository.findById.mockResolvedValue(makeIssuedNfseEntity(77));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(1);
    expect(nfmRepository.save).not.toHaveBeenCalled();
    const edited = nfmRepository.edit.mock.calls[0][0] as Nfm;
    expect(edited.props.id).toBe(10);
    expect(edited.props.nfse?.props.id).toBe(77);
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
  });

  it('should continue after one failure and count failed', async() => {
    // Arrange
    const ok = makeNfmDto();
    const fail = makeNfmDto();
    fail.client = { ...fail.client, id: 2, company: { id: 2, name: 'Outra' } };
    fail.clientItems = [{
      ...fail.clientItems[0],
      cnaeNbsIndop: makeCnaeNbsIndop(2),
    }];

    findElegibleClients.execute.mockResolvedValue([fail, ok]);
    nfmRepository.findByClientReferenceAndCnae
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    nfmRepository.save
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    findCompanyNfsConfigByCompanyId.execute
      .mockRejectedValueOnce(new AppException('Config NFS-e não encontrada'))
      .mockResolvedValueOnce(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 55, status: NfseStatus.PENDING });
    nfseRepository.findById.mockResolvedValue(makeIssuedNfseEntity(55));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      clientId: 2,
      cnaeNbsIndopId: 2,
      message: 'Config NFS-e não encontrada',
    });
    expect(nfmRepository.edit).toHaveBeenCalledTimes(1);
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 1,
      skipped: 0,
      failed: 1,
      errors: [
        {
          clientId: 2,
          cnaeNbsIndopId: 2,
          message: 'Config NFS-e não encontrada',
        },
      ],
    });
  });

  it('should mark failed when mapper rejects missing LC 116', async() => {
    // Arrange
    const nfm = makeNfmDto();
    nfm.clientItems[0].cnaeNbsIndop = {
      ...makeCnaeNbsIndop(1),
      serviceListItemCode: null,
    };
    findElegibleClients.execute.mockResolvedValue([nfm]);
    nfmRepository.findByClientReferenceAndCnae.mockResolvedValueOnce(null);
    nfmRepository.save.mockResolvedValue(9);
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toMatch(/ItemListaServico/);
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
  });

  it('should mark failed when elegible has no clientItems', async() => {
    // Arrange
    const nfm = makeNfmDto({ clientItems: [] });
    findElegibleClients.execute.mockResolvedValue([nfm]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({
      created: 0,
      skipped: 0,
      failed: 1,
      errors: [
        {
          clientId: 1,
          cnaeNbsIndopId: 0,
          message: 'Grupo NFM sem itens de serviço.',
        },
      ],
    });
    expect(nfmRepository.save).not.toHaveBeenCalled();
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
  });

  it('should mark failed when nfse is missing after issue', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmRepository.findByClientReferenceAndCnae.mockResolvedValue(null);
    nfmRepository.save.mockResolvedValue(99);
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 55, status: NfseStatus.PENDING });
    nfseRepository.findById.mockResolvedValue(null);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toContain('não encontrada após emissão');
    expect(nfmRepository.edit).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
  });

  it('should map generic Error message into failed errors', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmRepository.findByClientReferenceAndCnae.mockResolvedValue(null);
    nfmRepository.save.mockResolvedValue(1);
    findCompanyNfsConfigByCompanyId.execute.mockRejectedValue(new Error('timeout na API externa'));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toMatchObject({
      clientId: 1,
      cnaeNbsIndopId: 1,
      message: 'timeout na API externa',
    });
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
  });
});
