import { Test } from '@nestjs/testing';
import { CreateClientAddress } from 'src/app/client/client-address/application/usecases/create-client-address/create-client-address.service';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressAlreadyExistsError } from 'src/app/client/client-address/domain/errors/client-address-already-exists.error';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClient } from './create-client.service';
import { CreateClientInputDto } from './dtos/create-client.dto';

describe('CreateClient — saga (step 1: save client, step 2: create MAIN address)', () => {
  describe('success: both steps complete', () => {
    let sut: CreateClient;
    let prisma: PrismaService;

    beforeAll(async() => {
      const module = await Test.createTestingModule({
        imports: [ClientModule],
      }).compile();

      sut = module.get(CreateClient);
      prisma = module.get(PrismaService);
    });

    async function resetClientSequence(nextId = 1) {
      await prisma.clientSequence.upsert({
        where: { id: 1 },
        create: { id: 1, nextId },
        update: { nextId },
      });
    }

    beforeEach(async() => {
      await prisma.truncate();
      await resetClientSequence(1);
    });

    afterAll(async() => {
      await prisma.truncate();
      await resetClientSequence(1);
      await prisma.$disconnect();
    });

    async function createCompany() {
      const suffix = String(Date.now()).slice(-4);
      return prisma.company.create({
        data: {
          name: `Empresa ${Date.now()}`,
          fantasyName: 'Fantasia',
          document: `09.748.165/0001-${suffix}`,
          zipCode: '01310100',
          street: 'Av Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          phone01: '11999999999',
          email01: `test${suffix}@test.com`,
          active: true,
        },
      });
    }

    function makeValidInput(overrides: Partial<CreateClientInputDto> = {}): CreateClientInputDto {
      return {
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: 0,
        ownerId: 0,
        companyIds: [1],
        companyName: 'Empresa LTDA',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        address: {
          zipCode: '12345-678',
          street: 'Rua das Laranjeiras',
          number: '100',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
        ...overrides,
      };
    }

    it('should run step 1 then step 2 and leave client linked to MAIN address', async() => {
      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      const result = await sut.execute(input);

      expect(result.id).toBe(1);

      const client = await prisma.client.findUnique({ where: { id: result.id } });
      expect(client).not.toBeNull();
      expect(client?.document).toBe('09748165000110');

      const address = await prisma.clientAddress.findFirst({
        where: { clientId: result.id, type: ClientAddressType.MAIN },
      });
      expect(address).not.toBeNull();
      expect(address?.zipCode).toBe(input.address.zipCode);
      expect(address?.street).toBe(input.address.street);
      expect(address?.number).toBe(input.address.number);
      expect(address?.neighborhood).toBe(input.address.neighborhood);
      expect(address?.city).toBe(input.address.city);
      expect(address?.state).toBe(input.address.state);
    });
  });

  describe('rollback: step 2 fails after step 1', () => {
    let sut: CreateClient;
    let prisma: PrismaService;
    const createClientAddressMock = { execute: jest.fn() };

    beforeAll(async() => {
      const module = await Test.createTestingModule({
        imports: [ClientModule],
      })
        .overrideProvider(CreateClientAddress)
        .useValue(createClientAddressMock)
        .compile();

      sut = module.get(CreateClient);
      prisma = module.get(PrismaService);
    });

    async function resetClientSequence(nextId = 1) {
      await prisma.clientSequence.upsert({
        where: { id: 1 },
        create: { id: 1, nextId },
        update: { nextId },
      });
    }

    beforeEach(async() => {
      await prisma.truncate();
      await resetClientSequence(1);
      jest.clearAllMocks();
      createClientAddressMock.execute.mockReset();
    });

    afterAll(async() => {
      await prisma.truncate();
      await resetClientSequence(1);
      await prisma.$disconnect();
    });

    async function createCompany() {
      const suffix = String(Date.now()).slice(-4);
      return prisma.company.create({
        data: {
          name: `Empresa ${Date.now()}`,
          fantasyName: 'Fantasia',
          document: `09.748.165/0001-${suffix}`,
          zipCode: '01310100',
          street: 'Av Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          phone01: '11999999999',
          email01: `test${suffix}@test.com`,
          active: true,
        },
      });
    }

    function makeValidInput(overrides: Partial<CreateClientInputDto> = {}): CreateClientInputDto {
      return {
        type: ClientType.PJ,
        document: '09.748.165/0001-10',
        ie: null,
        groupId: 0,
        ownerId: 0,
        companyIds: [1],
        companyName: 'Empresa LTDA',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        address: {
          zipCode: '12345-678',
          street: 'Rua das Laranjeiras',
          number: '100',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
        ...overrides,
      };
    }

    it('should delete client and rethrow when step 2 throws a generic error', async() => {
      createClientAddressMock.execute.mockRejectedValue(new Error('step 2 failed'));

      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow('step 2 failed');

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();

      const addresses = await prisma.clientAddress.findMany();
      expect(addresses).toHaveLength(0);
    });

    it('should delete client and rethrow domain error from step 2', async() => {
      const domainError = new ClientAddressAlreadyExistsError(1, ClientAddressType.MAIN);
      createClientAddressMock.execute.mockRejectedValue(domainError);

      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      await expect(sut.execute(input)).rejects.toThrow(ClientAddressAlreadyExistsError);

      const saved = await prisma.client.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).toBeNull();
    });

    it('should invoke step 2 with new client id and MAIN type', async() => {
      createClientAddressMock.execute.mockResolvedValue({ id: 999 });

      const [group, owner, company] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
        createCompany(),
      ]);

      const input = makeValidInput({ groupId: group.id, ownerId: owner.id, companyIds: [company.id] });

      const result = await sut.execute(input);

      expect(createClientAddressMock.execute).toHaveBeenCalledTimes(1);
      expect(createClientAddressMock.execute).toHaveBeenCalledWith({
        clientId: result.id,
        type: ClientAddressType.MAIN,
        zipCode: input.address.zipCode,
        street: input.address.street,
        number: input.address.number,
        complement: input.address.complement,
        neighborhood: input.address.neighborhood,
        city: input.address.city,
        state: input.address.state,
      });
    });
  });
});
