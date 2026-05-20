import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientContactModule } from 'src/app/client/client-contact/client-contact.module';
import { ClientContactNotFoundError } from 'src/app/client/client-contact/domain/errors/client-contact-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ActivateClientContact } from './activate-client-contact.service';

describe('ActivateClientContact - Integration tests', () => {
  let sut: ActivateClientContact;
  let prisma: PrismaService;

  const createContact = async(active = false) => {
    const [group, resale, department] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.department.create({ data: { name: `Dept ${Date.now()}`, active: true } }),
    ]);
    const client = await prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: `12345678${Date.now() % 100000}00199`,
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
    return prisma.clientContact.create({
      data: {
        clientId: client.id,
        departmentId: department.id,
        name: 'Contato Test',
        email: `test${Date.now()}@example.com`,
        receiveNF: false,
        active,
      },
    });
  };

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientContactModule],
    }).compile();

    sut = module.get(ActivateClientContact);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientContactNotFoundError when contact does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should activate contact when currently inactive', async() => {
    const contact = await createContact(false);

    await sut.execute(contact.id);

    const updated = await prisma.clientContact.findUnique({ where: { id: contact.id } });
    expect(updated?.active).toBe(true);
  });

  it('should keep contact active when currently active', async() => {
    const contact = await createContact(true);

    await sut.execute(contact.id);

    const updated = await prisma.clientContact.findUnique({ where: { id: contact.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const contact = await createContact(false);

    const result = await sut.execute(contact.id);

    expect(result).toEqual({ message: 'Contato do cliente ativado com sucesso' });
  });
});
