import { Test } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { ClientPersistenceModule } from 'src/app/client/application/persistence/client-persistence.module';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientRepositoryAdapterPrisma } from './client.repository';

describe('ClientRepositoryAdapterPrisma', () => {
  let sut: ClientRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let company: Company;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ClientPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ClientRepositoryAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ClientRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.company.deleteMany();
    await prisma.client.deleteMany();

    company = await prisma.company.create({
      data: {
        name: 'name teste',
        fantasyName: 'fantasyName teste',
        document: 'document teste',
        ie: 'ie teste',
        zipCode: 'zipCode teste',
        street: 'street teste',
        number: 'number teste',
        neighborhood: 'neighborhood teste',
        city: 'city teste',
        state: 'state teste',
        phone01: 'phone01 teste',
        email01: 'email01 teste',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.client.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findById', () => {
    it('should return a client when found', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(client);

      // Act
      const foundClient = await sut.findById(client.props.id);

      // Assert
      expect(foundClient).toBeDefined();
      expect(foundClient?.props.id).toBe(client.props.id);
      expect(foundClient?.props.cnpj).toBe(client.props.cnpj);
      expect(foundClient?.props.ie).toBe(client.props.ie);
      expect(foundClient?.props.companyIds).toEqual([company.id]);
    });

    it('should return null when client is not found', async() => {
      // Act
      const foundClient = await sut.findById('non-existent-id');

      // Assert
      expect(foundClient).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a client and create a resource with the same id', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      // Act
      await sut.save(client);

      // Assert
      const savedClient = await prisma.client.findUnique({
        where: { id: client.props.id },
        include: { resource: true },
      });

      expect(savedClient).toBeDefined();
      expect(savedClient?.id).toBe(client.props.id);
      expect(savedClient?.kind).toBe(client.props.kind);
      expect(savedClient?.cnpj).toBe(client.props.cnpj);
      expect(savedClient?.ie).toBe(client.props.ie);
      expect(savedClient?.group).toBe(client.props.group);
      expect(savedClient?.type).toBe(client.props.type);
      expect(savedClient?.generateInvoice).toBe(client.props.generateInvoice);
      expect(savedClient?.companyName).toBe(client.props.companyName);
      expect(savedClient?.fantasyName).toBe(client.props.fantasyName);
      expect(savedClient?.owner).toBe(client.props.owner);
      expect(savedClient?.headquarters).toBe(client.props.headquarters);
      expect(savedClient?.active).toBe(client.props.active);

      // Check if resource was created with the same id
      expect(savedClient?.resource).toBeDefined();
      expect(savedClient?.resource?.id).toBe(client.props.id);
    });

    it('should save multiple clients with unique cnpj', async() => {
      // Arrange
      const client1 = Client.create({
        kind: 'PJ',
        cnpj: '11.938.884/0001-46',
        ie: '111.111.111.111',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'First Company Ltd',
        fantasyName: 'First Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      const client2 = Client.create({
        kind: 'PF',
        cnpj: '36.630.627/0001-73',
        ie: '222.222.222.222',
        group: 'Group B',
        type: 'Basic',
        generateInvoice: false,
        companyName: 'Second Company Ltd',
        fantasyName: 'Second Company',
        owner: 'Jane Doe',
        headquarters: 'Branch Office',
        companyIds: [company.id],
      });

      // Act
      await sut.save(client1);
      await sut.save(client2);

      // Assert
      const savedClients = await prisma.client.findMany();
      expect(savedClients).toHaveLength(2);

      const savedClient1 = savedClients.find(c => c.id === client1.props.id);
      const savedClient2 = savedClients.find(c => c.id === client2.props.id);

      expect(savedClient1).toBeDefined();
      expect(savedClient2).toBeDefined();
      expect(savedClient1?.cnpj).toBe(client1.props.cnpj);
      expect(savedClient2?.cnpj).toBe(client2.props.cnpj);
    });

    it('should throw error when trying to save client with duplicate cnpj', async() => {
      // Arrange
      const duplicateCnpj = '93.335.895/0001-04';
      const client1 = Client.create({
        kind: 'PJ',
        cnpj: duplicateCnpj,
        ie: '111.111.111.111',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'First Company Ltd',
        fantasyName: 'First Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      const client2 = Client.create({
        kind: 'PJ',
        cnpj: duplicateCnpj, // Same CNPJ
        ie: '222.222.222.222',
        group: 'Group B',
        type: 'Basic',
        generateInvoice: false,
        companyName: 'Second Company Ltd',
        fantasyName: 'Second Company',
        owner: 'Jane Doe',
        headquarters: 'Branch Office',
        companyIds: [company.id],
      });

      // Act & Assert
      await sut.save(client1);
      await expect(sut.save(client2)).rejects.toThrow();
    });

    it('should throw error when trying to connect to non-existent company', async() => {
      // Arrange
      const nonExistentCompanyId = 'non-existent-company-id';
      const client = Client.create({
        kind: 'PJ',
        cnpj: '36.444.234/0001-75',
        ie: '333.333.333.333',
        group: 'Group C',
        type: 'Standard',
        generateInvoice: true,
        companyName: 'Third Company Ltd',
        fantasyName: 'Third Company',
        owner: 'Jim Beam',
        headquarters: 'Headquarters',
        companyIds: [nonExistentCompanyId],
      });

      // Act & Assert
      await expect(sut.save(client)).rejects.toThrow();
    });

    it('should skip duplicate company connections when saving a client', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '36.444.234/0001-75',
        ie: '444.444.444.444',
        group: 'Group D',
        type: 'Standard',
        generateInvoice: false,
        companyName: 'Fourth Company Ltd',
        fantasyName: 'Fourth Company',
        owner: 'Alice Wonderland',
        headquarters: 'Main HQ',
        companyIds: [company.id, company.id], // Duplicate company IDs
      });

      // Act
      await sut.save(client);

      // Assert
      const savedClient = await prisma.client.findUnique({
        where: { id: client.props.id },
        include: { companies: true },
      });

      expect(savedClient).toBeDefined();
      expect(savedClient?.companies).toHaveLength(1);
      expect(savedClient?.companies[0].id).toBe(company.id);
    });

    it('should throw error when trying to save client with null companyIds', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '36.444.234/0001-75',
        ie: '666.666.666.666',
        group: 'Group F',
        type: 'Premium',
        generateInvoice: false,
        companyName: 'Sixth Company Ltd',
        fantasyName: 'Sixth Company',
        owner: 'Charlie Chocolate',
        headquarters: 'Candy Factory',
        companyIds: null as any, // Null companyIds
      });

      // Act & Assert
      await expect(sut.save(client)).rejects.toThrow();
    });
  });

  describe('edit', () => {
    it('should update client properties', async() => {
      // Arrange
      const originalClient = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Original Company Ltd',
        fantasyName: 'Original Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(originalClient);

      const updatedClient = Client.load({
        ...originalClient.props,
        companyName: 'Updated Company Ltd',
        fantasyName: 'Updated Company',
        owner: 'Jane Smith',
        type: 'Basic',
        generateInvoice: false,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedClient);

      // Assert
      const editedClient = await prisma.client.findUnique({
        where: { id: originalClient.props.id },
      });

      expect(editedClient).toBeDefined();
      expect(editedClient?.id).toBe(originalClient.props.id);
      expect(editedClient?.companyName).toBe(updatedClient.props.companyName);
      expect(editedClient?.fantasyName).toBe(updatedClient.props.fantasyName);
      expect(editedClient?.owner).toBe(updatedClient.props.owner);
      expect(editedClient?.type).toBe(updatedClient.props.type);
      expect(editedClient?.generateInvoice).toBe(updatedClient.props.generateInvoice);

      // These should remain unchanged
      expect(editedClient?.cnpj).toBe(originalClient.props.cnpj);
      expect(editedClient?.ie).toBe(originalClient.props.ie);
      expect(editedClient?.kind).toBe(originalClient.props.kind);
    });

    it('should throw error when trying to edit non-existent client', async() => {
      // Arrange
      const nonExistentClient = Client.load({
        id: 'non-existent-id',
        kind: 'PJ',
        cnpj: '54.968.396/0001-94',
        ie: '999.999.999.999',
        group: 'Group X',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Non Existent Company Ltd',
        fantasyName: 'Non Existent Company',
        owner: 'Ghost User',
        headquarters: 'Nowhere',
        active: true,
        companyIds: [company.id],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(nonExistentClient)).rejects.toThrow();
    });

    it('should update client to inactive status', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(client);

      const inactiveClient = Client.load({
        ...client.props,
        active: false,
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(inactiveClient);

      // Assert
      const editedClient = await prisma.client.findUnique({
        where: { id: client.props.id },
      });

      expect(editedClient).toBeDefined();
      expect(editedClient?.active).toBe(false);
    });

    it('should update client companies', async() => {
      // Arrange
      const anotherCompany = await prisma.company.create({
        data: {
          name: 'Another Company',
          fantasyName: 'Another Fantasy',
          document: '987654321',
          ie: 'IE987654',
          zipCode: '54321',
          street: 'Another St',
          number: '200',
          neighborhood: 'Another Neighborhood',
          city: 'Another City',
          state: 'Another State',
          phone01: '555-5678',
          email01: 'another@example.com',
          active: true,
        },
      });

      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(client);

      const updatedClient = Client.load({
        ...client.props,
        companyIds: [anotherCompany.id],
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedClient);

      // Assert
      const editedClient = await prisma.client.findUnique({
        where: { id: client.props.id },
        include: { companies: true },
      });

      expect(editedClient).toBeDefined();
      expect(editedClient?.companies).toHaveLength(1);
      expect(editedClient?.companies[0].id).toBe(anotherCompany.id);
    });

    it('should skip duplicate company connections when editing a client', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(client);

      const updatedClient = Client.load({
        ...client.props,
        companyIds: [company.id, company.id], // Duplicate company IDs
        updatedAt: new Date(),
      });

      // Act
      await sut.edit(updatedClient);

      // Assert
      const editedClient = await prisma.client.findUnique({
        where: { id: client.props.id },
        include: { companies: true },
      });

      expect(editedClient).toBeDefined();
      expect(editedClient?.companies).toHaveLength(1);
      expect(editedClient?.companies[0].id).toBe(company.id);
    });

    it('should throw error when trying to connect to non-existent company on edit', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(client);

      const nonExistentCompanyId = 'non-existent-company-id';
      const updatedClient = Client.load({
        ...client.props,
        companyIds: [nonExistentCompanyId],
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(updatedClient)).rejects.toThrow();
    });

    it('should throw error when trying to set null companyIds on edit', async() => {
      // Arrange
      const client = Client.create({
        kind: 'PJ',
        cnpj: '93.335.895/0001-04',
        ie: '123.456.789.012',
        group: 'Group A',
        type: 'Premium',
        generateInvoice: true,
        companyName: 'Test Company Ltd',
        fantasyName: 'Test Company',
        owner: 'John Doe',
        headquarters: 'Main Office',
        companyIds: [company.id],
      });

      await sut.save(client);

      const updatedClient = Client.load({
        ...client.props,
        companyIds: null as any, // Null companyIds
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(sut.edit(updatedClient)).rejects.toThrow();
    });
  });
});
