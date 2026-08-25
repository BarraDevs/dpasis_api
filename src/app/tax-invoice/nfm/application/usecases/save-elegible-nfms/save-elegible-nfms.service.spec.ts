import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { IssueNfse } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { NfmDto } from '../../dtos/nfm.dto';
import type { INfmCronRunDao } from '../../persistence/dao/nfm-cron-run-dao.interface';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
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
  };
}

describe('SaveElegibleNfms - Unit tests', () => {
  let sut: SaveElegibleNfms;
  let findElegibleClients: jest.Mocked<FindElegibleClients>;
  let nfmDao: jest.Mocked<INfmDao>;
  let nfmCronRunDao: jest.Mocked<INfmCronRunDao>;
  let findCompanyNfsConfigByCompanyId: jest.Mocked<FindCompanyNfsConfigByCompanyId>;
  let issueNfse: jest.Mocked<IssueNfse>;

  beforeEach(async() => {
    findElegibleClients = createMock<FindElegibleClients>();
    nfmDao = createMock<INfmDao>();
    nfmCronRunDao = createMock<INfmCronRunDao>();
    findCompanyNfsConfigByCompanyId = createMock<FindCompanyNfsConfigByCompanyId>();
    issueNfse = createMock<IssueNfse>();

    const module = await Test.createTestingModule({
      providers: [
        SaveElegibleNfms,
        { provide: FindElegibleClients, useValue: findElegibleClients },
        { provide: TOKENS.NfmDao, useValue: nfmDao },
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
    expect(nfmDao.save).not.toHaveBeenCalled();
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('should create nfm, issue nfse and link nfseId', async() => {
    // Arrange
    const nfm = makeNfmDto();
    findElegibleClients.execute.mockResolvedValue([nfm]);
    nfmDao.findByClientReferenceAndCnae.mockResolvedValue(null);
    nfmDao.save.mockResolvedValue(99);
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 55, status: NfseStatus.PENDING });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 1, skipped: 0, failed: 0, errors: [] });
    expect(nfmDao.save).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 1,
      cnaeNbsIndopId: 1,
      totalValueInCents: 10000,
    }));
    expect(issueNfse.execute).toHaveBeenCalledTimes(1);
    expect(nfmDao.edit).toHaveBeenCalledWith(99, { nfseId: 55 });
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    });
  });

  it('should skip when nfm already has nfseId', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmDao.findByClientReferenceAndCnae.mockResolvedValue({
      id: 10,
      nfseId: 20,
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0, skipped: 1, failed: 0, errors: [] });
    expect(nfmDao.save).not.toHaveBeenCalled();
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledWith({
      created: 0,
      skipped: 1,
      failed: 0,
      errors: [],
    });
  });

  it('should retry issue when nfm exists without nfseId', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmDao.findByClientReferenceAndCnae.mockResolvedValue({
      id: 10,
      nfseId: null,
    });
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 77, status: NfseStatus.PENDING });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(1);
    expect(nfmDao.save).not.toHaveBeenCalled();
    expect(nfmDao.edit).toHaveBeenCalledWith(10, { nfseId: 77 });
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
    nfmDao.findByClientReferenceAndCnae
      .mockResolvedValueOnce(null) // fail path — before issue
      .mockResolvedValueOnce(null); // ok path
    nfmDao.save
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    findCompanyNfsConfigByCompanyId.execute
      .mockRejectedValueOnce(new AppException('Config NFS-e não encontrada'))
      .mockResolvedValueOnce(makeProviderConfig());
    issueNfse.execute.mockResolvedValue({ id: 55, status: NfseStatus.PENDING });

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
    expect(nfmDao.edit).toHaveBeenCalledTimes(1);
    expect(nfmDao.edit).toHaveBeenCalledWith(2, { nfseId: 55 });
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
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
    nfmDao.findByClientReferenceAndCnae.mockResolvedValueOnce(null);
    nfmDao.save.mockResolvedValue(9);
    findCompanyNfsConfigByCompanyId.execute.mockResolvedValue(makeProviderConfig());

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toMatch(/ItemListaServico/);
    expect(issueNfse.execute).not.toHaveBeenCalled();
    expect(nfmCronRunDao.save).toHaveBeenCalledTimes(1);
  });
});
