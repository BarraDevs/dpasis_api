import { Test } from '@nestjs/testing';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { EditClientSystemTypeInputDto } from './dtos/edit-client-system-type.dto';
import { EditClientSystemType } from './edit-client-system-type.service';

describe('EditClientSystemType - Integration tests', () => {
  let sut: EditClientSystemType;
  let prisma: PrismaService;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(EditClientSystemType);
    prisma = module.get(PrismaService);
    uploadQueue = module.get(TOKENS.UploadFileQueueProducer) as UploadFileQueueFakeAdapterProducer;
  });

  beforeEach(async() => {
    await prisma.truncate();
    uploadQueue.addedDeleteJobs.length = 0;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientSystemTypeNotFoundError when client system type does not exist', async() => {
    const id = 0;

    const data: EditClientSystemTypeInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(id, data)).rejects.toThrow(ClientSystemTypeNotFoundError);
  });

  it('should update client system type name', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditClientSystemTypeInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(clientSystemType.id, data);

    const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true },
    });

    const data: EditClientSystemTypeInputDto = { name: `Novo nome ${Date.now()}` };

    const result = await sut.execute(clientSystemType.id, data);
    expect(result).toEqual({ message: 'Tipo de sistema de cliente atualizado com sucesso' });
  });

  it('should throw ClientSystemTypeAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Tipo A ${Date.now()}`;
    await prisma.clientSystemType.create({
      data: { name: nameA, active: true },
    });
    const clientSystemTypeB = await prisma.clientSystemType.create({
      data: { name: `Tipo B ${Date.now()}`, active: true },
    });

    const data: EditClientSystemTypeInputDto = { name: nameA };

    await expect(sut.execute(clientSystemTypeB.id, data)).rejects.toThrow(ClientSystemTypeAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same client system type being edited', async() => {
    const name = `Tipo ${Date.now()}`;
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name, active: true },
    });

    const data: EditClientSystemTypeInputDto = { name };
    await sut.execute(clientSystemType.id, data);

    const updated = await prisma.clientSystemType.findUnique({ where: { id: clientSystemType.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });

  it('should enqueue delete of previous image when imageUrl changes', async() => {
    const oldUrl = 'https://storage.example.com/old.png';
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo ${Date.now()}`, active: true, imageUrl: oldUrl },
    });

    const data: EditClientSystemTypeInputDto = {
      name: clientSystemType.name,
      imageUrl: 'https://cdn.example.com/new.png',
    };

    await sut.execute(clientSystemType.id, data);

    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0]).toEqual({
      name: JobName.DeleteFile,
      data: { fileUrl: oldUrl },
    });
  });
});
