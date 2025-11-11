import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDto } from '../../dtos/client.dto';
import { CreateClient } from '../create-client/create-client.service';
import { CreateClientInputDto } from '../create-client/dtos/create-client.dto';
import { FindClientById } from './find-client-by-id.service';

describe('FindClientById', () => {
  let sut: FindClientById;
  let prisma: PrismaService;
  let createClient: CreateClient;
  let companyId: string;
  let createCompany: CreateCompany;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindClientById);
    prisma = module.get(PrismaService);
    createClient = module.get(CreateClient);
    createCompany = module.get(CreateCompany);

    await prisma.company.deleteMany();

    companyId = (await createCompany.execute({
      name: 'name teste',
      fantasyName: 'fantasyName teste',
      document: 'document teste',
      ie: 'ie teste',
      zipCode: 'zipCode teste',
      street: 'street teste',
      number: 'number teste',
      neighborhood: 'neighborhood teste',
      complement: null,
      reference: null,
      city: 'city teste',
      state: 'state teste',
      cellphone: 'cellphone teste',
      phone01: 'phone01 teste',
      phone02: 'phone02 teste',
      email01: 'email01 teste',
      email02: 'email02 teste',
    })).id;
  });

  afterAll(async() => {
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call clientDao with correct arguments', async() => {
      // Arrange
      const id = 'client-id';
      const clientDaoSpy = jest.spyOn(sut['clientDao'], 'findById');

      // Act
      await sut.execute(id);

      // Assert
      expect(clientDaoSpy).toHaveBeenNthCalledWith(1, id);
    });
  });

  describe('integration tests', () => {
    it('should return null if client is not found', async() => {
      // Act
      const result = await sut.execute('id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return correct dto when client is found', async() => {
      // Arrange
      const data: CreateClientInputDto = {
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
        companyId,
      };
      const createdClient = await createClient.execute(data);

      // Act
      const result = await sut.execute(createdClient.id);

      // Assert
      expect(result).toEqual<ClientDto>({
        id: createdClient.id,
        kind: data.kind,
        cnpj: data.cnpj,
        ie: data.ie,
        group: data.group,
        type: data.type,
        generateInvoice: data.generateInvoice,
        companyName: data.companyName,
        fantasyName: data.fantasyName,
        owner: data.owner,
        headquarters: data.headquarters,
        active: true,
        companyId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
