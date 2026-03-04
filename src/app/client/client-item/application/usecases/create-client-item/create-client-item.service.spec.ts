import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { CnaeNbsIndopNotFoundError } from 'src/app/cnae-nbs-indop/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { CreateClientItem } from './create-client-item.service';
import { CreateClientItemInputDto } from './dtos/create-client-item.dto';

describe('CreateClientItem - Integration tests', () => {
  let sut: CreateClientItem;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(CreateClientItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner, cnae, nbs, indop] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);

    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    cnaeNbsIndopId = cnaeNbsIndop.id;

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
      cnaeNbsIndopId,
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw CnaeNbsIndopNotFoundError when cnaeNbsIndopId does not exist', async() => {
    const input: CreateClientItemInputDto = {
      clientId,
      description: 'Item teste',
      quantity: 1,
      unitValueInCents: 10000,
      cnaeNbsIndopId: 99999,
    };

    await expect(sut.execute(input)).rejects.toThrow(CnaeNbsIndopNotFoundError);
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
      cnaeNbsIndopId,
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientNotFoundError);
  });

  it('should create client item and return id', async() => {
    const input: CreateClientItemInputDto = {
      clientId,
      description: 'Item de teste',
      quantity: 2,
      unitValueInCents: 10000,
      cnaeNbsIndopId,
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientItem.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.clientId).toBe(input.clientId);
    expect(saved?.description).toBe(input.description);
    expect(saved?.quantity).toBe(input.quantity);
    expect(saved?.unitValueInCents).toBe(input.unitValueInCents);
    expect(saved?.cnaeNbsIndopId).toBe(input.cnaeNbsIndopId);
  });

  it('should create client item with quantity zero', async() => {
    const input: CreateClientItemInputDto = {
      clientId,
      description: 'Item com quantidade zero',
      quantity: 0,
      unitValueInCents: 10000,
      cnaeNbsIndopId,
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    const saved = await prisma.clientItem.findUnique({ where: { id: result.id } });
    expect(saved?.quantity).toBe(0);
  });

  it('should create client item with unitValueInCents zero', async() => {
    const input: CreateClientItemInputDto = {
      clientId,
      description: 'Item com valor unitário zero',
      quantity: 5,
      unitValueInCents: 0,
      cnaeNbsIndopId,
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    const saved = await prisma.clientItem.findUnique({ where: { id: result.id } });
    expect(saved?.unitValueInCents).toBe(0);
  });

  it('should create multiple items for the same client', async() => {
    const baseInput = {
      clientId,
      cnaeNbsIndopId,
    };

    const result1 = await sut.execute({
      ...baseInput,
      description: 'Item 1',
      quantity: 1,
      unitValueInCents: 10000,
    });
    const result2 = await sut.execute({
      ...baseInput,
      description: 'Item 2',
      quantity: 2,
      unitValueInCents: 5000,
    });

    expect(result1.id).not.toBe(result2.id);

    const items = await prisma.clientItem.findMany({ where: { clientId } });
    expect(items).toHaveLength(2);
  });

  it('should persist description with maximum length (255 chars)', async() => {
    const longDescription = 'a'.repeat(255);
    const input: CreateClientItemInputDto = {
      clientId,
      description: longDescription,
      quantity: 1,
      unitValueInCents: 10000,
      cnaeNbsIndopId,
    };

    const result = await sut.execute(input);

    const saved = await prisma.clientItem.findUnique({ where: { id: result.id } });
    expect(saved?.description).toBe(longDescription);
  });
});
