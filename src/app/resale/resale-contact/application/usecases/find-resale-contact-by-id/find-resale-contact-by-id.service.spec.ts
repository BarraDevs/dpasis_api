import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleContactModule } from '../../../resale-contact.module';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import { ResaleContactDto } from '../../dtos/resale-contact.dto';
import { FindResaleContactById } from './find-resale-contact-by-id.service';

describe('FindResaleContactById - Integration tests', () => {
  let sut: FindResaleContactById;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleContactModule],
    }).compile();

    sut = module.get(FindResaleContactById);
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
    await expect(sut.execute(99999)).rejects.toThrow(
      'Contato de revenda não encontrado na base de dados.',
    );
  });

  it('should return client contact by id', async() => {
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

    expect(result).not.toBeNull();
    expect(result.id).toBe(resaleContact.id);
    expect(result.name).toBe(resaleContact.name);
    expect(result.email).toBe(resaleContact.email);
  });

  it('should return all client contact fields correctly', async() => {
    const resaleContact = await prisma.resaleContact.create({
      data: {
        resaleId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        phone: '11999999999',
        whatsapp: '11988887777',
        observations: 'Observação',
        receiveNF: true,
        active: true,
      },
    });

    const result = await sut.execute(resaleContact.id);

    expect(result).toEqual<ResaleContactDto>({
      id: resaleContact.id,
      resaleId: resaleContact.resaleId,
      name: resaleContact.name,
      department: {
        id: resaleContact.departmentId,
        name: expect.any(String),
      },
      email: resaleContact.email,
      phone: resaleContact.phone,
      whatsapp: resaleContact.whatsapp,
      observations: resaleContact.observations,
      receiveNF: resaleContact.receiveNF,
      active: resaleContact.active,
      createdAt: resaleContact.createdAt,
      updatedAt: resaleContact.updatedAt,
    });
  });
});
