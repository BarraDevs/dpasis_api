import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import { ResaleDepartmentNotFoundError } from 'src/app/resale/resale-department/domain/errors/resale-department-not-found.error';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { ResaleContactModule } from '../../../resale-contact.module';
import { ResaleContactAlreadyExistsError } from '../../../domain/errors/resale-contact-already-exists.error';
import { CreateResaleContact } from './create-resale-contact.service';
import { CreateResaleContactExecuteInput } from './dtos/create-resale-contact.dto';

describe('CreateResaleContact - Integration tests', () => {
  let sut: CreateResaleContact;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleContactModule],
    }).compile();

    sut = module.get(CreateResaleContact);
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

  it('should throw ResaleContactAlreadyExistsError when creating with duplicate email for same resale', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ResaleContactAlreadyExistsError);
  });

  it('should allow same email for different resales', async() => {
    const resale2 = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });

    const input1: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };
    const input2: CreateResaleContactExecuteInput = {
      resaleId: resale2.id,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    const result1 = await sut.execute(input1);
    const result2 = await sut.execute(input2);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toBe(result2.id);
  });

  it('should throw InvalidEmailError when email is invalid', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João',
      email: 'invalid-email',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(InvalidEmailError);
  });

  it('should throw InvalidPhoneError when phone is invalid', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: '123',
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(InvalidPhoneError);
  });

  it('should throw InvalidPhoneError when whatsapp is invalid', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: '123',
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(InvalidPhoneError);
  });

  it('should throw ResaleNotFoundError when resale does not exist', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId: 99999,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ResaleNotFoundError);
  });

  it('should throw ResaleDepartmentNotFoundError when department does not exist', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId: 99999,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ResaleDepartmentNotFoundError);
  });

  it('should throw ResaleDepartmentNotFoundError when department is inactive', async() => {
    const inactiveDept = await prisma.resaleDepartment.create({
      data: { name: `Inactive ${Date.now()}`, active: false },
    });
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId: inactiveDept.id,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ResaleDepartmentNotFoundError);
  });

  it('should throw ResaleNotFoundError when resale is inactive', async() => {
    const inactiveResaleData = buildMinimalResaleData(nextResaleFixtureId());
    const inactiveResale = await prisma.resale.create({
      data: { ...inactiveResaleData, active: false },
    });

    const input: CreateResaleContactExecuteInput = {
      resaleId: inactiveResale.id,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ResaleNotFoundError);
  });

  it('should create resale contact and return id', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.resaleContact.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.email).toBe('joao@example.com');
    expect(saved?.receiveNF).toBe(false);
  });

  it('should persist email in lowercase', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João',
      email: 'Joao@Example.COM',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    const { id } = await sut.execute(input);

    const saved = await prisma.resaleContact.findUnique({ where: { id } });
    expect(saved?.email).toBe('joao@example.com');
  });

  it('should validate email with VO before checking uniqueness', async() => {
    const input: CreateResaleContactExecuteInput = {
      resaleId,
      departmentId,
      name: 'João',
      email: 'invalid',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(InvalidEmailError);
  });
});
