import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeAlreadyExistsError } from '../../../domain/errors/client-drive-type-already-exists.error';
import { CreateClientDriveType } from './create-client-drive-type.service';
import { CreateClientDriveTypeInputDto } from './dtos/create-client-drive-type.dto';

describe('CreateClientDriveType - Integration tests', () => {
  let sut: CreateClientDriveType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(CreateClientDriveType);
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

  it('should throw ClientDriveTypeAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Drive ${Date.now()}-${Math.random()}`;

    const input: CreateClientDriveTypeInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientDriveTypeAlreadyExistsError);
  });

  it('should create client drive type and return id', async() => {
    const input: CreateClientDriveTypeInputDto = {
      name: `Google Drive ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientDriveType.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist client drive type in database', async() => {
    const input: CreateClientDriveTypeInputDto = {
      name: `OneDrive ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const clientDriveType = await prisma.clientDriveType.findUnique({ where: { id } });
    expect(clientDriveType).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(clientDriveType?.createdAt).toBeInstanceOf(Date);
    expect(clientDriveType?.updatedAt).toBeInstanceOf(Date);
  });
});
