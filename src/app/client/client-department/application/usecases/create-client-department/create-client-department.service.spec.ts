import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentAlreadyExistsError } from '../../../domain/errors/client-department-already-exists.error';
import { CreateClientDepartment } from './create-client-department.service';
import { CreateClientDepartmentInputDto } from './dtos/create-client-department.dto';

describe('CreateClientDepartment - Integration tests', () => {
  let sut: CreateClientDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(CreateClientDepartment);
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

  it('should throw ClientDepartmentAlreadyExistsError when creating with duplicate name', async() => {
    // Arrange
    const input: CreateClientDepartmentInputDto = {
      name: 'Departamento Duplicado',
    };
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientDepartmentAlreadyExistsError);
  });

  it('should create client department and return id', async() => {
    // Arrange
    const input: CreateClientDepartmentInputDto = {
      name: 'Departamento Premium',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientDepartment.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client department in database', async() => {
    // Arrange
    const input: CreateClientDepartmentInputDto = {
      name: 'Departamento VIP',
    };

    // Act
    const { id } = await sut.execute(input);

    // Assert
    const clientDepartment = await prisma.clientDepartment.findUnique({ where: { id } });
    expect(clientDepartment).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientDepartment?.createdAt).toBeInstanceOf(Date);
    expect(clientDepartment?.updatedAt).toBeInstanceOf(Date);
  });
});
