import { Test } from '@nestjs/testing';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientHasSubClientsCannotSetParentError } from 'src/app/client/client/domain/errors/client-has-sub-clients-cannot-set-parent.error';
import { ClientParentIsSubClientError } from 'src/app/client/client/domain/errors/client-parent-is-sub-client.error';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { ClientPersistenceModule } from 'src/app/client/client/application/persistence/client-persistence.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SetClientParent } from './set-client-parent.service';

describe('SetClientParent - Integration tests', () => {
  let sut: SetClientParent;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule, ClientPersistenceModule],
      providers: [SetClientParent],
    }).compile();

    sut = module.get(SetClientParent);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function seedGroupAndResale() {
    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);
    return { group, resale, company };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should transfer sub-client from parent A to parent B', async() => {
    const { group, resale, company } = await seedGroupAndResale();

    const clientA = await prisma.client.create({
      data: {
        id: 6001,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Cliente A',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const clientB = await prisma.client.create({
      data: {
        id: 6002,
        type: ClientType.PJ,
        document: '28695096000179',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Cliente B',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const child = await prisma.client.create({
      data: {
        id: 6003,
        type: ClientType.PJ,
        document: '33000167000101',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Sub C',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        parentClientId: clientA.id,
        isSubClient: true,
      },
    });

    const result = await sut.execute(child.id, { parentClientId: clientB.id });

    expect(result.message).toContain('sucesso');

    const updated = await prisma.client.findUniqueOrThrow({ where: { id: child.id } });
    expect(updated.parentClientId).toBe(clientB.id);
    expect(updated.isSubClient).toBe(true);
  });

  it('should detach sub-client when parentClientId is null', async() => {
    const { group, resale, company } = await seedGroupAndResale();

    const parent = await prisma.client.create({
      data: {
        id: 6101,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Pai',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await prisma.client.create({
      data: {
        id: 6102,
        type: ClientType.PJ,
        document: '28695096000179',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Filho',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        parentClientId: parent.id,
        isSubClient: true,
      },
    });

    await sut.execute(6102, { parentClientId: null });

    const row = await prisma.client.findUniqueOrThrow({ where: { id: 6102 } });
    expect(row.parentClientId).toBeNull();
    expect(row.isSubClient).toBe(false);
  });

  it('should throw ClientHasSubClientsCannotSetParentError when root has sub-clients', async() => {
    const { group, resale, company } = await seedGroupAndResale();

    const root = await prisma.client.create({
      data: {
        id: 6201,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Raiz com filhos',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const otherParent = await prisma.client.create({
      data: {
        id: 6202,
        type: ClientType.PJ,
        document: '28695096000179',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Outro titular',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await prisma.client.create({
      data: {
        id: 6203,
        type: ClientType.PJ,
        document: '33000167000101',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Sub',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        parentClientId: root.id,
        isSubClient: true,
      },
    });

    await expect(sut.execute(root.id, { parentClientId: otherParent.id })).rejects.toThrow(
      ClientHasSubClientsCannotSetParentError,
    );
  });

  it('should throw ClientParentIsSubClientError when new parent is a sub-client', async() => {
    const { group, resale, company } = await seedGroupAndResale();

    const grand = await prisma.client.create({
      data: {
        id: 6301,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Raiz',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const subParent = await prisma.client.create({
      data: {
        id: 6302,
        type: ClientType.PJ,
        document: '28695096000179',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Ja sub-cliente',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        parentClientId: grand.id,
        isSubClient: true,
      },
    });

    await prisma.client.create({
      data: {
        id: 6304,
        type: ClientType.PJ,
        document: '33000167000101',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Alvo',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(6304, { parentClientId: subParent.id })).rejects.toThrow(ClientParentIsSubClientError);
  });

  it('should throw ClientNotFoundError when parent client does not exist', async() => {
    const { group, resale, company } = await seedGroupAndResale();

    await prisma.client.create({
      data: {
        id: 6401,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Sozinho',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(6401, { parentClientId: 99_997 })).rejects.toThrow(ClientNotFoundError);
  });
});
