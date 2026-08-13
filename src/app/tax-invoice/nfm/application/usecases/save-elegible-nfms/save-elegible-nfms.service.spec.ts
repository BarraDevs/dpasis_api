import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { NfmStatus } from '../../../domain/enums/nfm-status.enum';
import { NfmDto } from '../../dtos/nfm.dto';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
import { FindElegibleClients } from '../find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfms } from './save-elegible-nfms.service';

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
        cnaeNbsIndop: { id: 1 } as NfmDto['clientItems'][number]['cnaeNbsIndop'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        clientId: 1,
        description: 'Item 2',
        quantity: 1,
        unitValueInCents: 3000,
        totalValueInCents: 3000,
        active: true,
        cnaeNbsIndop: { id: 1 } as NfmDto['clientItems'][number]['cnaeNbsIndop'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  return { ...base, ...overrides };
}

describe('SaveElegibleNfms - Unit tests', () => {
  let sut: SaveElegibleNfms;
  let findElegibleClients: jest.Mocked<FindElegibleClients>;
  let nfmDao: jest.Mocked<INfmDao>;

  beforeEach(async() => {
    findElegibleClients = createMock<FindElegibleClients>();
    nfmDao = createMock<INfmDao>();

    const module = await Test.createTestingModule({
      providers: [
        SaveElegibleNfms,
        { provide: FindElegibleClients, useValue: findElegibleClients },
        { provide: TOKENS.NfmDao, useValue: nfmDao },
      ],
    }).compile();

    sut = module.get(SaveElegibleNfms);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return created 0 when no elegible clients', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0 });
    expect(nfmDao.saveMany).not.toHaveBeenCalled();
  });

  it('should map elegibles and persist with correct fields', async() => {
    // Arrange
    const nfm = makeNfmDto();
    findElegibleClients.execute.mockResolvedValue([nfm]);
    nfmDao.saveMany.mockResolvedValue(1);

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 1 });
    expect(nfmDao.saveMany).toHaveBeenCalledWith([
      {
        clientId: 1,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        status: NfmStatus.PENDING,
        referenceMonth,
        referenceYear,
        totalValueInCents: 13000,
        data: nfm,
      },
    ]);
  });

  it('should return created count from dao', async() => {
    // Arrange
    const secondNfm = makeNfmDto();
    secondNfm.client = { ...secondNfm.client, id: 2, document: '00000000000202', companyName: 'Outra' };
    findElegibleClients.execute.mockResolvedValue([makeNfmDto(), secondNfm]);
    nfmDao.saveMany.mockResolvedValue(2);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 2 });
    expect(nfmDao.saveMany).toHaveBeenCalledTimes(1);
  });

  it('should call findElegibleClients.execute once', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([]);

    // Act
    await sut.execute();

    // Assert
    expect(findElegibleClients.execute).toHaveBeenCalledTimes(1);
  });

  it('should return created 0 when dao saves zero rows', async() => {
    // Arrange
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmDao.saveMany.mockResolvedValue(0);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0 });
    expect(nfmDao.saveMany).toHaveBeenCalledTimes(1);
  });

  it('should compute totalValueInCents as 0 when client has no items', async() => {
    // Arrange
    const nfm = makeNfmDto({ clientItems: [] });
    findElegibleClients.execute.mockResolvedValue([nfm]);
    nfmDao.saveMany.mockResolvedValue(1);

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

    // Act
    await sut.execute();

    // Assert
    expect(nfmDao.saveMany).toHaveBeenCalledWith([
      expect.objectContaining({
        totalValueInCents: 0,
        referenceMonth,
        referenceYear,
        status: NfmStatus.PENDING,
      }),
    ]);
  });

  it('should propagate error when findElegibleClients fails', async() => {
    // Arrange
    const error = new Error('falha ao buscar elegíveis');
    findElegibleClients.execute.mockRejectedValue(error);

    // Act & Assert
    await expect(sut.execute()).rejects.toThrow(error);
    expect(nfmDao.saveMany).not.toHaveBeenCalled();
  });

  it('should propagate error when nfmDao.saveMany fails', async() => {
    // Arrange
    const error = new Error('falha ao persistir NFMs');
    findElegibleClients.execute.mockResolvedValue([makeNfmDto()]);
    nfmDao.saveMany.mockRejectedValue(error);

    // Act & Assert
    await expect(sut.execute()).rejects.toThrow(error);
  });
});
