import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentInUseError } from '../../../domain/errors/client-department-in-use.error';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import { DeleteClientDepartment } from './delete-client-department.service';

describe('DeleteClientDepartment - Integration tests', () => {
  let sut: DeleteClientDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(DeleteClientDepartment);
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

  it('should throw ClientDepartmentNotFoundError when client department does not exist', async() => {
    // Arrange
    const id = 0;

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientDepartmentNotFoundError);
  });

  it('should delete client department from database', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    await sut.execute(clientDepartment.id);

    // Assert
    const deleted = await prisma.clientDepartment.findUnique({ where: { id: clientDepartment.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento', active: true },
    });

    // Act
    const result = await sut.execute(clientDepartment.id);

    // Assert
    expect(result).toEqual({ message: 'Departamento de clientes excluído com sucesso' });
  });

  it('should throw ClientDepartmentInUseError when department has linked contacts', async() => {
    // Arrange
    const [group, owner, department] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.clientDepartment.create({ data: { name: `Dept ${Date.now()}`, active: true } }),
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

    await prisma.clientContact.create({
      data: {
        clientId: client.id,
        departmentId: department.id,
        name: 'Contato',
        email: 'contato@example.com',
        receiveNF: false,
      },
    });

    // Act & Assert
    await expect(sut.execute(department.id)).rejects.toThrow(ClientDepartmentInUseError);
  });
});
