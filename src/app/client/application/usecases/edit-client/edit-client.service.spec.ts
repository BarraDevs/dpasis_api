import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { ClientDuplicateIeError } from 'src/app/client/domain/errors/duplicate-ie.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDto } from '../../dtos/client.dto';
import { CreateClient } from '../create-client/create-client.service';
import { CreateClientInputDto } from '../create-client/dtos/create-client.dto';
import { FindClientById } from '../find-client-by-id/find-client-by-id.service';
import { EditClientInputDto } from './dtos/edit-client.dto';
import { EditClient } from './edit-client.service';

describe('EditClient', () => {
  let sut: EditClient;
  let prisma: PrismaService;
  let createClient: CreateClient;
  let findClientById: FindClientById;
  let data: CreateClientInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditClient);
    prisma = module.get(PrismaService);
    createClient = module.get(CreateClient);
    findClientById = module.get(FindClientById);

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
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('integration tests', () => {
    it('should throw an error when client does not exist', async() => {
      // Arrange
      const clientId = 'non-existing-client-id';

      // Act & Assert
      expect.assertions(1);
      return sut.execute(clientId, {}).catch((error) => {
        expect(error).toBeInstanceOf(ClientNotFoundError);
      });
    });

    it('should throw an error when cnpj is already used by another client', async() => {
      // Arrange
      await createClient.execute(data);
      const client2 = await createClient.execute({ ...data, cnpj: '98765432000188', ie: '987654321' });

      const editData: EditClientInputDto = {
        cnpj: data.cnpj,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(client2.id, editData).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateCnpjError);
      });
    });

    it('should throw an error when ie is already used by another client', async() => {
      // Arrange
      await createClient.execute(data);
      const client2 = await createClient.execute({ ...data, cnpj: '98765432000188', ie: '987654321' });

      const editData: EditClientInputDto = {
        ie: data.ie,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(client2.id, editData).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateIeError);
      });
    });

    it('should not throw an error when cnpj and ie are unchanged', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const editData: EditClientInputDto = {
        companyName: 'New Company Name',
      };

      // Act
      const result = await sut.execute(client.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Cliente editado com sucesso!' });
    });

    it('should not throw an error when cnpj is "changed" but remains the same', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const editData: EditClientInputDto = {
        cnpj: data.cnpj,
      };

      // Act
      const result = await sut.execute(client.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Cliente editado com sucesso!' });
    });

    it('should not throw an error when ie is "changed" but remains the same', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const editData: EditClientInputDto = {
        ie: '123456789',
      };

      // Act
      const result = await sut.execute(client.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Cliente editado com sucesso!' });
    });

    it('should not edit anything when no data is provided', async() => {
      // Arrange
      const client = await createClient.execute(data);

      // Act
      await sut.execute(client.id, {});

      // Assert
      const editedClient = await findClientById.execute(client.id);
      expect(editedClient).toMatchObject(data);
    });

    it('should edit a client successfully', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const editData: EditClientInputDto = {
        kind: 'contract',
        group: 'vip',
        companyName: 'John Doe Enterprises',
        cnpj: '11223344556677',
        ie: '9988776655',
      };

      // Act
      await sut.execute(client.id, editData);

      // Assert
      const editedClient = await findClientById.execute(client.id);
      expect(editedClient).toEqual<ClientDto>({
        id: client.id,
        kind: editData.kind ?? data.kind,
        cnpj: editData.cnpj ?? data.cnpj,
        ie: editData.ie ?? data.ie,
        group: editData.group ?? data.group,
        type: editData.type ?? data.type,
        generateInvoice: editData.generateInvoice ?? data.generateInvoice,
        companyName: editData.companyName ?? data.companyName,
        fantasyName: editData.fantasyName ?? data.fantasyName,
        owner: editData.owner ?? data.owner,
        headquarters: editData.headquarters ?? data.headquarters,
        active: true,
        createdAt: editedClient!.createdAt,
        updatedAt: editedClient!.updatedAt,
      });
    });
  });
});
