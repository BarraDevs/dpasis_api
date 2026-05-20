import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ResaleContactModule } from 'src/app/resale/resale-contact/resale-contact.module';
import { ResaleContactNotFoundError } from 'src/app/resale/resale-contact/domain/errors/resale-contact-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeactivateResaleContact } from './deactivate-resale-contact.service';

describe('DeactivateResaleContact - Integration tests', () => {
  let sut: DeactivateResaleContact;
  let prisma: PrismaService;

  const createContact = async(active = true) => {
    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.department.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });
    return prisma.resaleContact.create({
      data: {
        resaleId: resale.id,
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
      imports: [ResaleContactModule],
    }).compile();

    sut = module.get(DeactivateResaleContact);
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

  it('should throw ResaleContactNotFoundError when contact does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ResaleContactNotFoundError);
  });

  it('should deactivate contact in database', async() => {
    const contact = await createContact(true);

    await sut.execute(contact.id);

    const updated = await prisma.resaleContact.findUnique({ where: { id: contact.id } });
    expect(updated?.active).toBe(false);
  });

  it('should keep contact inactive when currently inactive', async() => {
    const contact = await createContact(false);

    await sut.execute(contact.id);

    const updated = await prisma.resaleContact.findUnique({ where: { id: contact.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    const contact = await createContact(true);

    const result = await sut.execute(contact.id);

    expect(result).toEqual({ message: 'Contato de revenda desativado com sucesso' });
  });
});
