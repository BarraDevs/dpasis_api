import { Test } from '@nestjs/testing';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import { CreateClientSystemType } from './create-client-system-type.service';
import { CreateClientSystemTypeInputDto } from './dtos/create-client-system-type.dto';

describe('CreateClientSystemType - Integration tests', () => {
  let sut: CreateClientSystemType;
  let uploadSingle: UploadSingle;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(CreateClientSystemType);
    uploadSingle = module.get(UploadSingle);
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

  it('should throw ClientSystemTypeAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Sistema ${Date.now()}-${Math.random()}`;
    const input: CreateClientSystemTypeInputDto = { name };

    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientSystemTypeAlreadyExistsError);
  });

  it('should create client system type and return id', async() => {
    const input: CreateClientSystemTypeInputDto = {
      name: `Sistema ERP ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should persist imageUrl when provided as external URL', async() => {
    const input: CreateClientSystemTypeInputDto = {
      name: `Sistema ${Date.now()}-${Math.random()}`,
      imageUrl: 'https://cdn.example.com/system-icon.png',
    };

    const { id } = await sut.execute(input);

    const saved = await prisma.clientSystemType.findUnique({ where: { id } });
    expect(saved?.imageUrl).toBe(input.imageUrl);
  });

  it('should upload file and persist imageUrl from uploaded file', async() => {
    // Mock de arquivo Multer (simula upload)
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'icon.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake file content'),
      size: 1500,
      destination: '/tmp',
      filename: 'icon.png',
      path: '/tmp/icon.png',
      stream: undefined as any,
    };

    // Mock do serviço de upload
    const imageUrlFromUpload = `https://cdn.example.com/uploads/${Date.now()}/icon.png`;

    // Espione o método uploadSingle.execute que será chamado internamente
    const uploadSpy = jest.spyOn(uploadSingle, 'execute').mockImplementation(async() => {
      return { url: imageUrlFromUpload };
    });

    const input: CreateClientSystemTypeInputDto = {
      name: `Sistema com upload ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input, mockFile);

    // uploadSingle deve ter sido chamado corretamente
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(uploadSpy).toHaveBeenCalledWith(expect.objectContaining({
      originalname: mockFile.originalname,
    }), 'client-system-types');

    const saved = await prisma.clientSystemType.findUnique({ where: { id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.imageUrl).toBe(imageUrlFromUpload);

    // Limpe mock do spy após uso
    uploadSpy.mockRestore();
  });

  it('should save imageUrl as null when no file is provided', async() => {
    const input: CreateClientSystemTypeInputDto = {
      name: `Sistema sem upload ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const saved = await prisma.clientSystemType.findUnique({ where: { id } });
    expect(saved?.imageUrl).toBeNull();
  });
});
