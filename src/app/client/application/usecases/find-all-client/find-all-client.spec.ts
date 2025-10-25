import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination';
import { ClientDto } from '../../dtos/client.dto';
import { CreateClient } from '../create-client/create-client.service';
import { CreateClientInputDto } from '../create-client/dtos/create-client.dto';
import { FindAllClientQueryDto } from './dtos/find-all-client.dto';
import { FindAllClient } from './find-all-client.service';

describe('FindAllClient', () => {
  let sut: FindAllClient;
  let prisma: PrismaService;
  let createClient: CreateClient;
  let data: CreateClientInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllClient);
    prisma = module.get(PrismaService);
    createClient = module.get(CreateClient);

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

    await prisma.client.deleteMany();
  });

  afterAll(async() => {
    await prisma.client.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientDao with correct parameters', async() => {
    const findAllSpy = jest.spyOn(sut['clientDao'], 'findAll').mockResolvedValue([[], 0]);
    const queries = createMock<FindAllClientQueryDto>({ page: 1, size: 10 });

    await sut.execute(queries);

    expect(findAllSpy).toHaveBeenCalledWith(queries);
  });

  it('should return an empty pagination when no clients exist', async() => {
    const result = await sut.execute({});

    expect(result).toEqual<IPagination<ClientDto>>({
      data: [],
      currentPage: 1,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('should return a pagination with clients when they exist', async() => {
    const client1 = await createClient.execute({ ...data, cnpj: '12345678000199', ie: '123456789' });
    const client2 = await createClient.execute({ ...data, cnpj: '98765432000199', ie: '987654321' });

    const result = await sut.execute({});

    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: client1.id }),
        expect.objectContaining({ id: client2.id }),
      ])
    );
  });

  it('should return a pagination with filtered clients based on companyName', async() => {
    const client1 = await createClient.execute({ ...data, companyName: 'Alpha Corp', cnpj: '12345678000199', ie: '123456789' });
    const client2 = await createClient.execute({ ...data, companyName: 'Beta LLC', cnpj: '98765432000199', ie: '987654321' });

    const result = await sut.execute({ companyName: 'Alpha' });

    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.itemsPerPage).toBe(1);
    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: client1.id }),
      ])
    );
    expect(result.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: client2.id }),
      ])
    );
  });

  it('should return a pagination with filtered clients based on cnpj', async() => {
    const client1 = await createClient.execute({ ...data, cnpj: '12345678000199', ie: '123456789' });
    const client2 = await createClient.execute({ ...data, cnpj: '98765432000199', ie: '987654321' });

    const result = await sut.execute({ cnpj: '12345678' });

    expect(result.currentPage).toBe(1);
    expect(result.totalItems).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.itemsPerPage).toBe(1);
    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: client1.id }),
      ])
    );
    expect(result.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: client2.id }),
      ])
    );
  });
});
