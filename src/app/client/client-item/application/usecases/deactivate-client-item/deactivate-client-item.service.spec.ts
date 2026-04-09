import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemModule } from '../../../client-item.module';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { DeactivateClientItem } from './deactivate-client-item.service';

describe('DeactivateClientItem - Integration tests', () => {
  let sut: DeactivateClientItem;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientItemModule],
    }).compile();

    sut = module.get(DeactivateClientItem);
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

    const cni = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    cnaeNbsIndopId = cni.id;

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

  const createItem = async(active = true) => {
    return prisma.clientItem.create({
      data: {
        clientId,
        description: 'Item Test',
        quantity: 2,
        unitValueInCents: 10000,
        cnaeNbsIndopId,
        active,
      },
    });
  };

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientItemNotFoundError when item does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientItemNotFoundError);
  });

  it('should deactivate item when currently active', async() => {
    const item = await createItem(true);

    await sut.execute(item.id);

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated?.active).toBe(false);
  });

  it('should keep item inactive when currently inactive', async() => {
    const item = await createItem(false);

    await sut.execute(item.id);

    const updated = await prisma.clientItem.findUnique({ where: { id: item.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    const item = await createItem(true);

    const result = await sut.execute(item.id);

    expect(result).toEqual({ message: 'Item do cliente desativado com sucesso' });
  });
});
