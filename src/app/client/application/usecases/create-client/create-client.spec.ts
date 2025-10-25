import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { ClientDuplicateIeError } from 'src/app/client/domain/errors/duplicate-ie.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClient } from './create-client.service';
import { CreateClientInputDto } from './dtos/create-client.dto';

describe('CreateClient', () => {
  let sut: CreateClient;
  let prisma: PrismaService;
  let data: CreateClientInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateClient);
    prisma = module.get(PrismaService);

    await prisma.client.deleteMany({});

    data = {
      kind: 'individual',
      cnpj: '12345678000199',
      ie: '123456789',
      group: 'default',
      type: 'customer',
      generateInvoice: true,
      companyName: 'John Doe Ltda',
      fantasyName: 'John Doe',
      owner: 'John Doe',
      headquarters: '123 Main St, City, State, ZIP',
    };
  });

  afterAll(async() => {
    await prisma.client.deleteMany({});
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if cnpj is duplicated', async() => {
    // act
    await sut.execute(data);

    // assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(ClientDuplicateCnpjError);
    });
  });

  it('should throw an error if ie is duplicated', async() => {
    // act
    await sut.execute({
      ...data,
      cnpj: 'anothercnpj12345678',
    });

    // assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(ClientDuplicateIeError);
    });
  });

  it('should call clientDao.findByCnpj with correct values', async() => {
    const findByCnpjSpy = jest.spyOn(sut['clientDao'], 'findByCnpj');

    await sut.execute(data);

    expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
  });

  it('should call clientDao.findByIe with correct values', async() => {
    const findByIeSpy = jest.spyOn(sut['clientDao'], 'findByIe');

    await sut.execute(data);

    expect(findByIeSpy).toHaveBeenCalledWith(data.ie);
  });

  it('should call clientRepository.save with correct values', async() => {
    jest.spyOn(sut['clientDao'], 'findByCnpj').mockResolvedValue(null);
    jest.spyOn(sut['clientDao'], 'findByIe').mockResolvedValue(null);

    const saveSpy = jest.spyOn(sut['clientRepository'], 'save');

    await sut.execute(data);

    expect(saveSpy).toHaveBeenCalledWith(expect.any(Client));
  });

  it('should return the created client id', async() => {
    const result = await sut.execute(data);

    expect(result).toHaveProperty('id', expect.any(String));
  });

  it('should create a new client entity', async() => {
    const createSpy = jest.spyOn(Client, 'create');

    await sut.execute(data);

    expect(createSpy).toHaveBeenNthCalledWith(1, data);
  });

  it('should handle concurrent creation attempts correctly', async() => {
    const data1 = { ...data, cnpj: 'concurrent1', ie: 'ie1' };
    const data2 = { ...data, cnpj: 'concurrent2', ie: 'ie2' };

    const [result1, result2] = await Promise.all([
      sut.execute(data1),
      sut.execute(data2),
    ]);

    expect(result1.id).not.toBe(result2.id);
  });

  it('should create with correct default values', async() => {
    const result = await sut.execute(data);

    const createdClient = await prisma.client.findUnique({ where: { id: result.id } });
    expect(createdClient).toEqual(
      expect.objectContaining({
        active: true,
        mainAddressId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
  });

  // TODO: trocar pelo findById
  it('should create a client', async() => {
    const result = await sut.execute(data);
    expect(result).toHaveProperty('id', expect.any(String));

    const createdClient = await prisma.client.findUnique({ where: { id: result.id } });
    expect(createdClient).toEqual({
      ...data,
      id: result.id,
      active: true,
      mainAddressId: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
