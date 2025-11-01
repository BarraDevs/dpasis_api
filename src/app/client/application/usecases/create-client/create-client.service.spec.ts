import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { ClientDuplicateIeError } from 'src/app/client/domain/errors/duplicate-ie.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDto } from '../../dtos/client.dto';
import { FindClientById } from '../find-client-by-id/find-client-by-id.service';
import { CreateClient } from './create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from './dtos/create-client.dto';

describe('CreateClient', () => {
  let sut: CreateClient;
  let prisma: PrismaService;
  let findClientById: FindClientById;
  let data: CreateClientInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateClient);
    findClientById = module.get(FindClientById);
    prisma = module.get(PrismaService);

    await prisma.client.deleteMany();

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
    await prisma.client.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if cnpj is duplicate', async() => {
      // Arrange
      const client = createMock<ClientDto>();
      const findByCnpjSpy = jest.spyOn(sut['clientDao'], 'findByCnpj').mockResolvedValue(client);
      const findByIeSpy = jest.spyOn(sut['clientDao'], 'findByIe').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['clientRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateCnpjError);
        expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
        expect(findByIeSpy).not.toHaveBeenCalled();
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if ie is duplicate', async() => {
      // Arrange
      const client = createMock<ClientDto>();
      const findByCnpjSpy = jest.spyOn(sut['clientDao'], 'findByCnpj').mockResolvedValue(null);
      const findByIeSpy = jest.spyOn(sut['clientDao'], 'findByIe').mockResolvedValue(client);
      const saveSpy = jest.spyOn(sut['clientRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateIeError);
        expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
        expect(findByIeSpy).toHaveBeenCalledWith(data.ie);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should create a client and return its id', async() => {
      // Arrange
      const findByCnpjSpy = jest.spyOn(sut['clientDao'], 'findByCnpj').mockResolvedValue(null);
      const findByIeSpy = jest.spyOn(sut['clientDao'], 'findByIe').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['clientRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
      expect(findByIeSpy).toHaveBeenCalledWith(data.ie);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Client));
      expect(result).toEqual<CreateClientOutputDto>({ id: result.id });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if cnpj is duplicate', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateCnpjError);
      });
    });

    it('should throw an error if ie is duplicate', async() => {
      // Arrange
      await sut.execute(data);
      const newData = { ...data, cnpj: '98765432000199' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(newData).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateIeError);
      });
    });

    it('should persist the client in the database', async() => {
      // Act
      const createResult = await sut.execute(data);
      const clientDto = await findClientById.execute(createResult.id);

      // Assert
      expect(clientDto).toBeDefined();
      expect(clientDto).toEqual<ClientDto>({
        id: createResult.id,
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
