import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ActivateClientAddress } from './activate-client-address.service';

describe('ActivateClientAddress - Integration tests', () => {
  let sut: ActivateClientAddress;
  let prisma: PrismaService;

  const createAddress = async(active = false) => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);
    const client = await prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${Date.now() % 100000}00199`,
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
    return prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Test',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        active,
      },
    });
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(ActivateClientAddress);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientAddressNotFoundError when address does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientAddressNotFoundError);
  });

  it('should activate address in database', async() => {
    const address = await createAddress(false);

    await sut.execute(address.id);

    const updated = await prisma.clientAddress.findUnique({ where: { id: address.id } });
    expect(updated?.active).toBe(true);
  });

  it('should keep address active when it is already active', async() => {
    const address = await createAddress(true);

    await sut.execute(address.id);

    const updated = await prisma.clientAddress.findUnique({ where: { id: address.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const address = await createAddress(false);

    const result = await sut.execute(address.id);

    expect(result).toEqual({ message: 'Endereço do cliente ativado com sucesso' });
  });
});
