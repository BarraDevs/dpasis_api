import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientAddressQueueFakeAdapterProducer } from 'src/app/client/client-address/infra/driven/queue/fake/client-address-queue-fake.producer';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientAddress } from './edit-client-address.service';

describe('EditClientAddress - Integration tests', () => {
  let sut: EditClientAddress;
  let prisma: PrismaService;
  let queueProducer: ClientAddressQueueFakeAdapterProducer;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAddressModule],
    }).compile();

    sut = module.get(EditClientAddress);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.ClientAddressQueueProducer);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedResolveIbgeCodeJobs.length = 0;

    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientAddressNotFoundError when address does not exist', async() => {
    const data = { street: 'Rua Nova' };

    await expect(sut.execute(99999, data)).rejects.toThrow(ClientAddressNotFoundError);
    await expect(sut.execute(99999, data)).rejects.toThrow('Endereço do cliente não encontrado.');
  });

  it('should edit address and return success message', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Original',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    const result = await sut.execute(created.id, {
      street: 'Rua Editada',
      number: '999',
      zipCode: '98765-432',
    });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const updated = await prisma.clientAddress.findUnique({
      where: { id: created.id },
    });
    expect(updated?.street).toBe('Rua Editada');
    expect(updated?.number).toBe('999');
    expect(updated?.zipCode).toBe('98765-432');
    expect(updated?.neighborhood).toBe('Centro');
    expect(updated?.city).toBe('São Paulo');
    expect(updated?.state).toBe('SP');
  });

  it('should edit only provided fields (partial update)', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.SUPPORT,
        zipCode: '12345-678',
        street: 'Rua Original',
        number: '1',
        complement: 'Apto 1',
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { street: 'Rua Atualizada' });

    const updated = await prisma.clientAddress.findUnique({
      where: { id: created.id },
    });
    expect(updated?.street).toBe('Rua Atualizada');
    expect(updated?.zipCode).toBe('12345-678');
    expect(updated?.number).toBe('1');
    expect(updated?.complement).toBe('Apto 1');
    expect(updated?.neighborhood).toBe('Centro');
    expect(updated?.city).toBe('São Paulo');
    expect(updated?.state).toBe('SP');
  });

  it('should edit address type', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Cobrança',
        number: '2',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { type: ClientAddressType.CORRESPONDENCE });

    const updated = await prisma.clientAddress.findUnique({
      where: { id: created.id },
    });
    expect(updated?.type).toBe(ClientAddressType.CORRESPONDENCE);
  });

  it('should edit complement to null', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '1',
        complement: 'Apto 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { complement: null });

    const updated = await prisma.clientAddress.findUnique({
      where: { id: created.id },
    });
    expect(updated?.complement).toBeNull();
  });

  it('should edit complement to new value', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { complement: 'Sala 205' });

    const updated = await prisma.clientAddress.findUnique({
      where: { id: created.id },
    });
    expect(updated?.complement).toBe('Sala 205');
  });

  it('should pass with empty data object (no changes)', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Principal',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    const result = await sut.execute(created.id, {});

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const unchanged = await prisma.clientAddress.findUnique({
      where: { id: created.id },
    });
    expect(unchanged?.street).toBe('Rua Principal');
    expect(unchanged?.zipCode).toBe('12345-678');
  });

  it('should enqueue resolve-ibge-code job when edited cityCodeIbge is null', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { cityCodeIbge: null });

    expect(queueProducer.addedResolveIbgeCodeJobs).toHaveLength(1);
    expect(queueProducer.addedResolveIbgeCodeJobs[0].data).toEqual({
      clientAddressId: created.id,
      zipCode: '12345-678',
    });
  });

  it('should not enqueue resolve-ibge-code job when resulting cityCodeIbge is present', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { street: 'Rua Editada' });

    expect(queueProducer.addedResolveIbgeCodeJobs).toHaveLength(0);
  });

  it('should enqueue resolve-ibge-code job with updated zipCode when cityCodeIbge is null', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: null,
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { zipCode: '98765-432' });

    expect(queueProducer.addedResolveIbgeCodeJobs).toHaveLength(1);
    expect(queueProducer.addedResolveIbgeCodeJobs[0].data).toEqual({
      clientAddressId: created.id,
      zipCode: '98765-432',
    });
  });

  it('should re-enqueue resolve-ibge-code job on unrelated edit when stored cityCodeIbge is already null', async() => {
    const created = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: null,
        state: 'SP',
        active: true,
      },
    });

    await sut.execute(created.id, { street: 'Rua Editada' });

    expect(queueProducer.addedResolveIbgeCodeJobs).toHaveLength(1);
    expect(queueProducer.addedResolveIbgeCodeJobs[0].data).toEqual({
      clientAddressId: created.id,
      zipCode: '12345-678',
    });
  });
});
