import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { FindAllClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/find-all-client-invoice-config/find-all-client-invoice-config.service';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { FindAllClientItem } from 'src/app/client/client-item/application/usecases/find-all-client-item/find-all-client-item.service';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { SearchClient } from 'src/app/client/client/application/usecases/search-client/search-client.service';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FindElegibleClients } from './find-elegible-clients.service';

function makePagination<T>(data: T[]): IPagination<T> {
  return {
    data,
    totalItems: data.length,
    totalPages: data.length > 0 ? 1 : 0,
    currentPage: 1,
    itemsPerPage: 100,
  };
}

function makeClientDto(overrides: Partial<ClientDto> = {}): ClientDto {
  return {
    id: 1,
    type: 'PJ',
    document: '00.000.000/0001-00',
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
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    active: true,
    honorific: null,
    group: { id: 1, name: 'Grupo' },
    resale: { id: 1, name: 'Revenda' },
    company: { id: 1, name: 'Empresa' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeInvoiceConfigDto(overrides: Partial<ClientInvoiceConfigDto> = {}): ClientInvoiceConfigDto {
  const baseDate = new Date();
  const billingAddress: ClientInvoiceConfigDto['billingAddress'] = {
    id: 100,
    clientId: 1,
    type: ClientAddressType.BILLING,
    zipCode: '00000-000',
    street: 'Rua Teste',
    number: '1',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    cityCodeIbge: '3550308',
    state: 'SP',
    active: true,
    createdAt: baseDate,
    updatedAt: baseDate,
  };
  const bank: ClientInvoiceConfigDto['bank'] = {
    id: 200,
    drawer: 'Drawer',
    wallet: '1',
    account: '1',
    agency: '1',
    bankCode: '001',
    bankName: 'Banco Teste',
    paymentLocation: null,
    active: true,
    createdAt: baseDate,
    updatedAt: baseDate,
  };

  return {
    id: 10,
    clientId: 1,
    generateNf: true,
    type: 'MONTHLY' as any,
    emissionDay: 1,
    dueDateType: 'DUE_DATE' as any,
    dueDateDay: new Date().getDate(),
    dueMonth: null,
    deadlineDays: null,
    months: [],
    billingAddress,
    bank,
    autoProtestBoleto: false,
    issWithheld: false,
    message: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

function makeClientItemDto(overrides: Partial<ClientItemDto> = {}): ClientItemDto {
  return {
    id: 50,
    clientId: 1,
    description: 'Item de teste',
    quantity: 1,
    unitValueInCents: 10000,
    totalValueInCents: 10000,
    active: true,
    cnaeNbsIndop: { id: 1 } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FindElegibleClients - Unit tests', () => {
  let sut: FindElegibleClients;
  let searchClient: SearchClient;
  let findAllClientInvoiceConfig: FindAllClientInvoiceConfig;
  let findAllClientItem: FindAllClientItem;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindElegibleClients,
        { provide: SearchClient, useValue: createMock<SearchClient>() },
        { provide: FindAllClientInvoiceConfig, useValue: createMock<FindAllClientInvoiceConfig>() },
        { provide: FindAllClientItem, useValue: createMock<FindAllClientItem>() },
      ],
    }).compile();

    sut = module.get(FindElegibleClients);
    searchClient = module.get(SearchClient);
    findAllClientInvoiceConfig = module.get(FindAllClientInvoiceConfig);
    findAllClientItem = module.get(FindAllClientItem);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call findAllClientInvoiceConfig with dueDateDay=today and generateNf=true', async() => {
    // Arrange
    const today = new Date().getDate();
    const invoiceConfigSpy = jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([]));

    // Act
    await sut.execute();

    // Assert
    expect(invoiceConfigSpy).toHaveBeenCalledTimes(1);
    expect(invoiceConfigSpy).toHaveBeenCalledWith({ dueDateDay: today, generateNf: true });
  });

  it('should call searchClient with client IDs from invoice configs, invoiceType=CONTRACT, active=true, generateInvoice=true', async() => {
    // Arrange
    const invoice1 = makeInvoiceConfigDto({ clientId: 10 });
    const invoice2 = makeInvoiceConfigDto({ clientId: 20 });
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([invoice1, invoice2]));
    const searchSpy = jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([]));
    jest.spyOn(findAllClientItem, 'execute').mockResolvedValue(makePagination([]));

    // Act
    await sut.execute();

    // Assert
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith({
      filter: {
        id: { in: [10, 20] },
        invoiceType: { eq: ClientInvoiceType.CONTRACT },
        active: { eq: true },
        generateInvoice: { eq: true },
      },
    });
  });

  it('should call findAllClientItem for each matching client with active=true', async() => {
    // Arrange
    const invoice = makeInvoiceConfigDto({ clientId: 1 });
    const client1 = makeClientDto({ id: 1 });
    const client2 = makeClientDto({ id: 2 });
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([invoice, makeInvoiceConfigDto({ id: 11, clientId: 2 })]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([client1, client2]));
    const itemsSpy = jest.spyOn(findAllClientItem, 'execute').mockResolvedValue(makePagination([]));

    // Act
    await sut.execute();

    // Assert
    expect(itemsSpy).toHaveBeenCalledTimes(2);
    expect(itemsSpy).toHaveBeenCalledWith({ clientId: 1, active: true });
    expect(itemsSpy).toHaveBeenCalledWith({ clientId: 2, active: true });
  });

  it('should NOT call findAllClientItem when clients list is empty', async() => {
    // Arrange
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([makeInvoiceConfigDto()]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([]));
    const itemsSpy = jest.spyOn(findAllClientItem, 'execute').mockResolvedValue(makePagination([]));

    // Act
    await sut.execute();

    // Assert
    expect(itemsSpy).not.toHaveBeenCalled();
  });

  it('should return empty array when no invoice configs match today', async() => {
    // Arrange
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([]));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should return empty array when no clients pass the combined filters', async() => {
    // Arrange
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([makeInvoiceConfigDto({ clientId: 5 })]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([]));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should return NfmDto with correct shape (client + invoiceConfig + items)', async() => {
    // Arrange
    const client = makeClientDto({ id: 1 });
    const invoiceConfig = makeInvoiceConfigDto({ clientId: 1 });
    const item = makeClientItemDto({ clientId: 1 });
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([invoiceConfig]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([client]));
    jest.spyOn(findAllClientItem, 'execute').mockResolvedValue(makePagination([item]));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      client,
      clientInvoiceConfig: invoiceConfig,
      clientItems: [item],
    });
  });

  it('should omit client when findAllClientItem returns no active items', async() => {
    // Arrange
    const client = makeClientDto({ id: 1 });
    const invoiceConfig = makeInvoiceConfigDto({ clientId: 1 });
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([invoiceConfig]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([client]));
    jest.spyOn(findAllClientItem, 'execute').mockResolvedValue(makePagination([]));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should handle multiple eligible clients correctly', async() => {
    // Arrange
    const client1 = makeClientDto({ id: 1 });
    const client2 = makeClientDto({ id: 2 });
    const invoiceConfig1 = makeInvoiceConfigDto({ id: 10, clientId: 1 });
    const invoiceConfig2 = makeInvoiceConfigDto({ id: 11, clientId: 2 });
    const item1 = makeClientItemDto({ id: 50, clientId: 1 });
    const item2 = makeClientItemDto({ id: 51, clientId: 2 });
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([invoiceConfig1, invoiceConfig2]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([client1, client2]));
    jest.spyOn(findAllClientItem, 'execute')
      .mockResolvedValueOnce(makePagination([item1]))
      .mockResolvedValueOnce(makePagination([item2]));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ client: client1, clientInvoiceConfig: invoiceConfig1, clientItems: [item1] });
    expect(result[1]).toMatchObject({ client: client2, clientInvoiceConfig: invoiceConfig2, clientItems: [item2] });
  });

  it('should emit one NfmDto per cnaeNbsIndop group for the same client', async() => {
    // Arrange
    const client = makeClientDto({ id: 1 });
    const invoiceConfig = makeInvoiceConfigDto({ clientId: 1 });
    const itemA1 = makeClientItemDto({
      id: 50,
      clientId: 1,
      description: 'xpto',
      totalValueInCents: 10,
      cnaeNbsIndop: { id: 1 } as any,
    });
    const itemA2 = makeClientItemDto({
      id: 51,
      clientId: 1,
      description: 'foo',
      totalValueInCents: 35,
      cnaeNbsIndop: { id: 1 } as any,
    });
    const itemB = makeClientItemDto({
      id: 52,
      clientId: 1,
      description: 'bar',
      totalValueInCents: 100,
      cnaeNbsIndop: { id: 2 } as any,
    });
    jest.spyOn(findAllClientInvoiceConfig, 'execute').mockResolvedValue(makePagination([invoiceConfig]));
    jest.spyOn(searchClient, 'execute').mockResolvedValue(makePagination([client]));
    jest.spyOn(findAllClientItem, 'execute').mockResolvedValue(makePagination([itemA1, itemA2, itemB]));

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].clientItems).toEqual([itemA1, itemA2]);
    expect(result[1].clientItems).toEqual([itemB]);
  });
});
