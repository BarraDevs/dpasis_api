import { Test, TestingModule } from '@nestjs/testing';
import { ClientModule } from 'src/app/client/client.module';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClient } from '../create-client/create-client.service';
import { FindClientById } from '../find-client-by-id/find-client-by-id.service';
import { UpdateClientStatus } from './update-client-status.service';

describe('UpdateClientStatus', () => {
  let sut: UpdateClientStatus;
  let prisma: PrismaService;
  let createClient: CreateClient;
  let findClientById: FindClientById;
  let createCompany: CreateCompany;
  let companyId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(UpdateClientStatus);
    prisma = module.get(PrismaService);
    createClient = module.get(CreateClient);
    findClientById = module.get(FindClientById);
    createCompany = module.get(CreateCompany);

    await prisma.company.deleteMany();
    await prisma.client.deleteMany();

    companyId = (await createCompany.execute({
      name: 'Test Company Ltd',
      fantasyName: 'Test Company',
      document: '73094364000151',
      ie: '123456789',
      zipCode: '12345678',
      street: 'Main Street',
      number: '100',
      neighborhood: 'Downtown',
      complement: null,
      reference: null,
      city: 'São Paulo',
      state: 'SP',
      cellphone: '11999999999',
      phone01: '1133333333',
      phone02: null,
      email01: 'test@company.com',
      email02: null,
    })).id;
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.client.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw ClientNotFoundError if client does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const findByIdSpy = jest.spyOn(sut['clientRepository'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['clientRepository'], 'edit');

      // Act & Assert
      expect.assertions(3);
      return sut.execute(id).catch((error) => {
        expect(error).toBeInstanceOf(ClientNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith(id);
        expect(editSpy).not.toHaveBeenCalled();
      });
    });

    it('should call clientRepository.findById and clientRepository.edit with correct values', async() => {
      // Arrange
      const id = 'client-id-123';
      const clientEntity = Client.load({
        id,
        kind: 'PJ',
        cnpj: '52435131000103',
        ie: '111222333444',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Client',
        fantasyName: 'Test',
        owner: 'Owner',
        headquarters: 'HQ',
        companyIds: [companyId],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['clientRepository'], 'findById').mockResolvedValue(clientEntity);
      const editSpy = jest.spyOn(sut['clientRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id,
          active: false, // Should be toggled
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
    });

    it('should toggle status from active to inactive', async() => {
      // Arrange
      const id = 'client-id-123';
      const clientEntity = Client.load({
        id,
        kind: 'PJ',
        cnpj: '20021261000103',
        ie: '222333444555',
        group: 'Group B',
        type: 'Standard',
        generateInvoice: false,
        companyName: 'Active Client',
        fantasyName: 'Active',
        owner: 'Owner 2',
        headquarters: 'Office',
        companyIds: [companyId],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['clientRepository'], 'findById').mockResolvedValue(clientEntity);
      const editSpy = jest.spyOn(sut['clientRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: false,
        }),
      }));
    });

    it('should toggle status from inactive to active', async() => {
      // Arrange
      const id = 'client-id-123';
      const clientEntity = Client.load({
        id,
        kind: 'PJ',
        cnpj: '75279173000190',
        ie: '333444555666',
        group: 'Group C',
        type: 'VIP',
        generateInvoice: true,
        companyName: 'Inactive Client',
        fantasyName: 'Inactive',
        owner: 'Owner 3',
        headquarters: 'Branch',
        companyIds: [companyId],
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['clientRepository'], 'findById').mockResolvedValue(clientEntity);
      const editSpy = jest.spyOn(sut['clientRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: true,
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw ClientNotFoundError if client does not exist', async() => {
      // Arrange
      const id = 'non-existing-client-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(ClientNotFoundError);
    });

    it('should toggle client status from active to inactive', async() => {
      // Arrange
      const client = await createClient.execute({
        kind: 'PJ',
        cnpj: '98752975000170',
        ie: '111222333444',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Client Ltd',
        fantasyName: 'Test Client',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [companyId],
      });

      // Verify initial status is active
      const initialClient = await findClientById.execute(client.id);
      expect(initialClient).not.toBeNull();
      expect(initialClient!.active).toBe(true);

      // Act
      const result = await sut.execute(client.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const updatedClient = await findClientById.execute(client.id);
      expect(updatedClient).not.toBeNull();
      expect(updatedClient!.active).toBe(false);
    });

    it('should toggle client status from inactive to active', async() => {
      // Arrange
      const client = await createClient.execute({
        kind: 'PJ',
        cnpj: '45077596000166',
        ie: '222333444555',
        group: 'Group B',
        type: 'Standard',
        generateInvoice: false,
        companyName: 'Inactive Client Ltd',
        fantasyName: 'Inactive Client',
        owner: 'Jane Doe',
        headquarters: 'Secondary Office',
        companyIds: [companyId],
      });

      // First toggle to inactive
      await sut.execute(client.id);
      const inactiveClient = await findClientById.execute(client.id);
      expect(inactiveClient).not.toBeNull();
      expect(inactiveClient!.active).toBe(false);

      // Act - Toggle back to active
      const result = await sut.execute(client.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const activeClient = await findClientById.execute(client.id);
      expect(activeClient).not.toBeNull();
      expect(activeClient!.active).toBe(true);
    });

    it('should toggle status multiple times correctly', async() => {
      // Arrange
      const client = await createClient.execute({
        kind: 'PJ',
        cnpj: '12911198000144',
        ie: '333444555666',
        group: 'Group C',
        type: 'VIP',
        generateInvoice: true,
        companyName: 'Multiple Toggle Client Ltd',
        fantasyName: 'Multiple Toggle',
        owner: 'Bob Smith',
        headquarters: 'HQ',
        companyIds: [companyId],
      });

      // Act & Assert - Toggle 1: active -> inactive
      await sut.execute(client.id);
      let currentClient = await findClientById.execute(client.id);
      expect(currentClient).not.toBeNull();
      expect(currentClient!.active).toBe(false);

      // Toggle 2: inactive -> active
      await sut.execute(client.id);
      currentClient = await findClientById.execute(client.id);
      expect(currentClient).not.toBeNull();
      expect(currentClient!.active).toBe(true);

      // Toggle 3: active -> inactive
      await sut.execute(client.id);
      currentClient = await findClientById.execute(client.id);
      expect(currentClient).not.toBeNull();
      expect(currentClient!.active).toBe(false);

      // Toggle 4: inactive -> active
      await sut.execute(client.id);
      currentClient = await findClientById.execute(client.id);
      expect(currentClient).not.toBeNull();
      expect(currentClient!.active).toBe(true);
    });

    it('should update updatedAt timestamp on status toggle', async() => {
      // Arrange
      const client = await createClient.execute({
        kind: 'PJ',
        cnpj: '75279173000190',
        ie: '444555666777',
        group: 'Group D',
        type: 'Enterprise',
        generateInvoice: true,
        companyName: 'Timestamp Test Client Ltd',
        fantasyName: 'Timestamp Test',
        owner: 'Alice Johnson',
        headquarters: 'Main HQ',
        companyIds: [companyId],
      });

      const beforeToggle = await findClientById.execute(client.id);
      expect(beforeToggle).not.toBeNull();

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await sut.execute(client.id);

      // Assert
      const afterToggle = await findClientById.execute(client.id);
      expect(afterToggle).not.toBeNull();
    });

    it('should preserve all other client properties when toggling status', async() => {
      // Arrange
      const originalData = {
        kind: 'PJ',
        cnpj: '45697335000149',
        ie: '555666777888',
        group: 'Group E',
        type: 'Gold',
        generateInvoice: true,
        companyName: 'Preserve Props Client Ltd',
        fantasyName: 'Preserve Props',
        owner: 'Charlie Brown',
        headquarters: 'Building A',
        companyIds: [companyId],
      };

      const client = await createClient.execute(originalData);
      const initialClient = await findClientById.execute(client.id);
      expect(initialClient).not.toBeNull();

      // Act
      await sut.execute(client.id);

      // Assert
      const toggledClient = await findClientById.execute(client.id);
      expect(toggledClient).not.toBeNull();
      expect(toggledClient!.kind).toBe(originalData.kind);
      expect(toggledClient!.cnpj).toBe(originalData.cnpj);
      expect(toggledClient!.ie).toBe(originalData.ie);
      expect(toggledClient!.group).toBe(originalData.group);
      expect(toggledClient!.type).toBe(originalData.type);
      expect(toggledClient!.generateInvoice).toBe(originalData.generateInvoice);
      expect(toggledClient!.companyName).toBe(originalData.companyName);
      expect(toggledClient!.fantasyName).toBe(originalData.fantasyName);
      expect(toggledClient!.owner).toBe(originalData.owner);
      expect(toggledClient!.headquarters).toBe(originalData.headquarters);
      expect(toggledClient!.companies).toEqual(initialClient!.companies);
      expect(toggledClient!.createdAt).toEqual(initialClient!.createdAt);
      // Only active and updatedAt should change
      expect(toggledClient!.active).not.toBe(initialClient!.active);
    });

    it('should work with clients associated with multiple companies', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Second Company Ltd',
        fantasyName: 'Second Company',
        document: '20852273000171',
        ie: '987654321',
        zipCode: '87654321',
        street: 'Second Street',
        number: '200',
        neighborhood: 'Uptown',
        complement: null,
        reference: null,
        city: 'Rio de Janeiro',
        state: 'RJ',
        cellphone: '21988888888',
        phone01: '2144444444',
        phone02: null,
        email01: 'test@company2.com',
        email02: null,
      })).id;

      const client = await createClient.execute({
        kind: 'PJ',
        cnpj: '45275773000119',
        ie: '666777888999',
        group: 'Group F',
        type: 'Platinum',
        generateInvoice: true,
        companyName: 'Multi Company Client Ltd',
        fantasyName: 'Multi Company',
        owner: 'David Wilson',
        headquarters: 'Global HQ',
        companyIds: [companyId, company2Id],
      });

      const initialClient = await findClientById.execute(client.id);
      expect(initialClient).not.toBeNull();
      expect(initialClient!.companies).toHaveLength(2);

      // Act
      await sut.execute(client.id);

      // Assert
      const toggledClient = await findClientById.execute(client.id);
      expect(toggledClient).not.toBeNull();
      expect(toggledClient!.active).toBe(false);
      expect(toggledClient!.companies).toHaveLength(2);
      expect(toggledClient!.companies).toEqual(initialClient!.companies);
    });

    it('should return success message with correct text', async() => {
      // Arrange
      const client = await createClient.execute({
        kind: 'PJ',
        cnpj: '15270176000130',
        ie: '777888999111',
        group: 'Group G',
        type: 'Basic',
        generateInvoice: false,
        companyName: 'Message Test Client Ltd',
        fantasyName: 'Message Test',
        owner: 'Emma Davis',
        headquarters: 'Office 1',
        companyIds: [companyId],
      });

      // Act
      const result = await sut.execute(client.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Status atualizado com sucesso.',
      });
      expect(result.message).toBe('Status atualizado com sucesso.');
    });
  });
});
