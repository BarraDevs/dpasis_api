import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { ClientDuplicateCnpjError } from 'src/app/client/domain/errors/duplicate-cnpj.error';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
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
  let companyId: string;
  let createCompany: CreateCompany;

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
    createCompany = module.get(CreateCompany);

    await prisma.company.deleteMany();
    await prisma.client.deleteMany();

    companyId = (await createCompany.execute({
      name: 'name teste',
      fantasyName: 'fantasyName teste',
      document: '81689219000141',
      ie: 'ie teste',
      zipCode: 'zipCode teste',
      street: 'street teste',
      number: 'number teste',
      neighborhood: 'neighborhood teste',
      complement: null,
      reference: null,
      city: 'city teste',
      state: 'state teste',
      cellphone: '1199887766',
      phone01: '1199887766',
      phone02: '1199887766',
      email01: 'email01@teste.com',
      email02: 'email02@teste.com',
    })).id;

    data = {
      kind: 'individual',
      cnpj: '69578571000104',
      ie: '123456789',
      group: 'default',
      type: 'customer',
      generateInvoice: true,
      companyName: 'John Doe Ltda',
      fantasyName: 'John Doe',
      owner: 'John Doe',
      headquarters: '123 Main St, City, State, ZIP',
      companyIds: [companyId],
    };
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
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
      const client2 = await createClient.execute({ ...data, cnpj: '80693036000137', ie: '987654321' });

      const editData: EditClientInputDto = {
        cnpj: data.cnpj,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(client2.id, editData).catch((error) => {
        expect(error).toBeInstanceOf(ClientDuplicateCnpjError);
      });
    });

    it('should throw an error when company does not exist', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const editData: EditClientInputDto = {
        companyIds: ['non-existing-company-id'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(client.id, editData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should not throw an error when cnpj and company are unchanged', async() => {
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

    it('should not edit anything when no data is provided', async() => {
      // Arrange
      const client = await createClient.execute(data);
      const clientBeforeEdit = await findClientById.execute(client.id);

      const editData: EditClientInputDto = {};

      // Act
      await sut.execute(client.id, editData);

      // Assert
      const editedClient = await findClientById.execute(client.id);
      expect(editedClient).toMatchObject(clientBeforeEdit!);
    });

    it('should edit a client successfully', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const editData: EditClientInputDto = {
        kind: 'contract',
        group: 'vip',
        companyName: 'John Doe Enterprises',
        cnpj: '60079322000108',
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
        companies: editedClient!.companies,
      });
    });

    it('should change the company of a client successfully', async() => {
      // Arrange
      const client = await createClient.execute(data);

      const newCompany = await createCompany.execute({
        name: 'New Company Ltd',
        fantasyName: 'New Company',
        document: '32451250000134',
        ie: '5544332211',
        zipCode: 'new zipCode',
        street: 'new street',
        number: 'new number',
        neighborhood: 'new neighborhood',
        complement: null,
        reference: null,
        city: 'new city',
        state: 'new state',
        cellphone: '1199887766',
        phone01: '1199887766',
        phone02: null,
        email01: 'jhondoe@mail.com',
        email02: null,
      });

      const editData: EditClientInputDto = {
        companyIds: [newCompany.id],
      };

      // Act
      await sut.execute(client.id, editData);

      // Assert
      const editedClient = await findClientById.execute(client.id);
      expect(editedClient!.companies[0].id).toBe(newCompany.id);
    });
  });
});
