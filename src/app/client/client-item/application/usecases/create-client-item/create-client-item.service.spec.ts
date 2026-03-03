import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { CreateClientItem } from './create-client-item.service';
import { CreateClientItemInputDto } from './dtos/create-client-item.dto';

describe('CreateClientItem - Integration tests', () => {
  let sut: CreateClientItem;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(CreateClientItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientNotFoundError when client does not exist', async() => {
    const input: CreateClientItemInputDto = {
      clientId: 99999,
      description: 'Item teste',
      quantity: 1,
      unitValueInCents: 10000,
      cnae: '1234567',
      nbs: '12345678',
      indop: '1',
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw ClientNotFoundError when client is inactive', async() => {
    const [group2, owner2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);
    const inactiveClient = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group2.id,
        ownerId: owner2.id,
        companyName: 'Cliente Inativo',
        fantasyName: null,
        headquarters: 'Rio',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: false,
      },
    });

    const input: CreateClientItemInputDto = {
      clientId: inactiveClient.id,
      description: 'Item teste',
      quantity: 1,
      unitValueInCents: 10000,
      cnae: '1234567',
      nbs: '12345678',
      indop: '1',
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientNotFoundError);
  });

  it('should create client item and return id', async() => {
    const input: CreateClientItemInputDto = {
      clientId,
      description: 'Item de teste',
      quantity: 2,
      unitValueInCents: 10000,
      cnae: '1234567',
      nbs: '12345678',
      indop: '1',
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientItem.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved).toEqual({
      ...input,
      id: result.id,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
