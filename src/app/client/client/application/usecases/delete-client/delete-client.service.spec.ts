import { Test } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClient } from './delete-client.service';

describe('DeleteClient - Integration tests', () => {
  let sut: DeleteClient;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    sut = module.get(DeleteClient);
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

  it('should throw ClientNotFoundError when client does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Cliente não encontrado na base de dados.');
  });

  it('should delete client from database', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa LTDA',
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await sut.execute(client.id);

    const deleted = await prisma.client.findUnique({ where: { id: client.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const result = await sut.execute(client.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
