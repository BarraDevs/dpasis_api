import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientMainAddressCannotBeDeletedError } from 'src/app/client/client-address/domain/errors/client-main-address-cannot-be-deleted.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClientAddress } from './delete-client-address.service';

describe('DeleteClientAddress', () => {
  let sut: DeleteClientAddress;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(DeleteClientAddress);
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

  it('should throw ClientAddressNotFoundError when address does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientAddressNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('ClientAddress não encontrado.');
  });

  it('should throw ClientMainAddressCannotBeDeletedError when address is MAIN type', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Principal',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    await expect(sut.execute(created.id)).rejects.toThrow(ClientMainAddressCannotBeDeletedError);
    await expect(sut.execute(created.id)).rejects.toThrow('Endereço principal não pode ser excluído.');

    const stillExists = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete address and return success message when address is not MAIN', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Cobrança',
        number: '2',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });

    const deleted = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should delete address of type SUPPORT', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.SUPPORT,
        zipCode: '98765-432',
        street: 'Rua Chamado',
        number: '3',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Exclusão realizada com sucesso');
    const deleted = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should delete address of type CORRESPONDENCE', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.CORRESPONDENCE,
        zipCode: '11111-111',
        street: 'Rua Correspondência',
        number: '4',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Exclusão realizada com sucesso');
    const deleted = await prisma.clientAddress.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
