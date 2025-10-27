import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { ClientPersistenceModule } from 'src/app/client/application/persistence/client-persistence.module';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientRepositoryAdapterPrisma } from './client.repository';

describe('ClientRepositoryAdapterPrisma', () => {
  let sut: ClientRepositoryAdapterPrisma;
  let prisma: PrismaService;

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

    await prisma.client.deleteMany();
  });

  afterAll(async() => {
    await prisma.client.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save a client and return its id', async() => {
      const data = {
        cnpj: '12345678000199',
        ie: '123456789',
        kind: 'individual',
        group: 'default',
        type: 'customer',
        generateInvoice: true,
        companyName: 'John Doe Ltda',
        fantasyName: 'John Doe',
        owner: 'John Doe',
        headquarters: '123 Main St, City, State, ZIP',
      };
      const client = Client.create(data);

      const clientId = await sut.save(client);

      const savedClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      expect(savedClient).toBeDefined();
      expect(savedClient).toEqual<ClientDto>({
        id: clientId,
        cnpj: data.cnpj,
        ie: data.ie,
        kind: data.kind,
        group: data.group,
        type: data.type,
        generateInvoice: data.generateInvoice,
        companyName: data.companyName,
        fantasyName: data.fantasyName,
        owner: data.owner,
        headquarters: data.headquarters,
        active: true,
        createdAt: savedClient!.createdAt,
        updatedAt: savedClient!.updatedAt,
      });
    });

    it('should call prisma.client.create with correct parameters', async() => {
      const client = createMock<Client>();
      const prismaCreateSpy = jest.spyOn(prisma.client, 'create').mockResolvedValue({ id: 'client-id' } as any);

      await sut.save(client);

      expect(prismaCreateSpy).toHaveBeenCalledWith({
        data: { ...client.props },
      });
    });
  });

  describe('edit', () => {
    it('should edit a client', async() => {
      const data = {
        cnpj: '12345678000199',
        ie: '123456789',
        kind: 'individual',
        group: 'default',
        type: 'customer',
        generateInvoice: true,
        companyName: 'John Doe Ltda',
        fantasyName: 'John Doe',
        owner: 'John Doe',
        headquarters: '123 Main St, City, State, ZIP',
      };
      const client = Client.create(data);
      const clientId = await sut.save(client);

      const clientEdited = Client.load({
        ...client.props,
        ...data,
        companyName: 'Company Edited Ltda',
      });

      await sut.edit(clientEdited);

      const updatedClient = await prisma.client.findUnique({
        where: { id: client.props.id },
      });
      expect(updatedClient).toBeDefined();
      expect(updatedClient!.id).toBe(clientId);
      expect(updatedClient!.companyName).toBe('Company Edited Ltda');
    });

    it('should call prisma.client.update with correct parameters', async() => {
      const client = createMock<Client>();
      const prismaUpdateSpy = jest.spyOn(prisma.client, 'update').mockResolvedValue({} as any);

      await sut.edit(client);

      expect(prismaUpdateSpy).toHaveBeenCalledWith({
        where: { id: client.props.id },
        data: { ...client.props },
      });
    });
  });
});
