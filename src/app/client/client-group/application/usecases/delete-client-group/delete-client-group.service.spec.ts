import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientGroupModule } from '../../../client-group.module';
import { ClientGroupInUseError } from '../../../domain/errors/client-group-in-use.error';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { DeleteClientGroup } from './delete-client-group.service';

describe('DeleteClientGroup - Integration tests', () => {
  let sut: DeleteClientGroup;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(DeleteClientGroup);
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

  it('should throw ClientGroupNotFoundError when client group does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientGroupNotFoundError);
  });

  it('should delete client group from database', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });

    // Act
    await sut.execute(clientGroup.id);

    // Assert
    const deleted = await prisma.clientGroup.findUnique({ where: { id: clientGroup.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo', active: true },
    });

    // Act
    const result = await sut.execute(clientGroup.id);

    // Assert
    expect(result).toEqual({ message: 'Grupo de clientes excluído com sucesso' });
  });

  it('should throw ClientGroupInUseError when group has linked clients', async() => {
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
    await expect(sut.execute(group.id)).rejects.toThrow(ClientGroupInUseError);
  });
});
