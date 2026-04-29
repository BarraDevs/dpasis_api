import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleContactModule } from '../../../resale-contact.module';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import { DeleteResaleContact } from './delete-resale-contact.service';

describe('DeleteResaleContact - Integration tests', () => {
  let sut: DeleteResaleContact;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleContactModule],
    }).compile();

    sut = module.get(DeleteResaleContact);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.resaleDepartment.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });

    resaleId = resale.id;
    departmentId = department.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ResaleContactNotFoundError when client contact does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ResaleContactNotFoundError);
  });

  it('should delete client contact from database', async() => {
    const resaleContact = await prisma.resaleContact.create({
      data: {
        resaleId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });

    await sut.execute(resaleContact.id);

    const deleted = await prisma.resaleContact.findUnique({
      where: { id: resaleContact.id },
    });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const resaleContact = await prisma.resaleContact.create({
      data: {
        resaleId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });

    const result = await sut.execute(resaleContact.id);

    expect(result).toEqual({ message: 'Contato de revenda excluído com sucesso' });
  });
});
