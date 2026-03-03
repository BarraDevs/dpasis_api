import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientOwnerModule } from '../../../client-owner.module';
import { ClientOwnerInUseError } from '../../../domain/errors/client-owner-in-use.error';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import { DeleteClientOwner } from './delete-client-owner.service';

describe('DeleteClientOwner - Integration tests', () => {
  let sut: DeleteClientOwner;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientOwnerModule],
    }).compile();

    sut = module.get(DeleteClientOwner);
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

  it('should throw ClientOwnerNotFoundError when client owner does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientOwnerNotFoundError);
  });

  it('should delete client owner from database', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: true },
    });

    // Act
    await sut.execute(clientOwner.id);

    // Assert
    const deleted = await prisma.clientOwner.findUnique({ where: { id: clientOwner.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário', active: true },
    });

    // Act
    const result = await sut.execute(clientOwner.id);

    // Assert
    expect(result).toEqual({ message: 'Proprietário de clientes excluído com sucesso' });
  });

  it('should throw ClientOwnerInUseError when owner has linked clients', async() => {
    // Arrange
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    await prisma.client.create({
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

    // Act & Assert
    await expect(sut.execute(owner.id)).rejects.toThrow(ClientOwnerInUseError);
  });
});
