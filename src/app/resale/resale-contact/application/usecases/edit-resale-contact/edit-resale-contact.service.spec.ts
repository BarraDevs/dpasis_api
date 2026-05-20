import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { DepartmentNotFoundError } from 'src/app/global/department/domain/errors/department-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import { ResaleContactModule } from '../../../resale-contact.module';
import { ResaleContactAlreadyExistsError } from '../../../domain/errors/resale-contact-already-exists.error';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import { EditResaleContactInputDto } from './dtos/edit-resale-contact.dto';
import { EditResaleContact } from './edit-resale-contact.service';

describe('EditResaleContact - Integration tests', () => {
  let sut: EditResaleContact;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleContactModule],
    }).compile();

    sut = module.get(EditResaleContact);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.department.create({
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
    const data: EditResaleContactInputDto = {
      name: 'João',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(99999, data)).rejects.toThrow(ResaleContactNotFoundError);
  });

  it('should update client contact', async() => {
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
    const data: EditResaleContactInputDto = {
      name: 'João Silva',
      departmentId,
      email: 'joao.silva@example.com',
      receiveNF: true,
    };

    await sut.execute(resaleContact.id, data);

    const updated = await prisma.resaleContact.findUnique({
      where: { id: resaleContact.id },
    });
    expect(updated?.name).toBe('João Silva');
    expect(updated?.email).toBe('joao.silva@example.com');
    expect(updated?.receiveNF).toBe(true);
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
    const data: EditResaleContactInputDto = {
      name: 'João Silva',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    const result = await sut.execute(resaleContact.id, data);

    expect(result).toEqual({ message: 'Contato de revenda atualizado com sucesso' });
  });

  it('should throw ResaleContactAlreadyExistsError when editing to duplicate email for same client', async() => {
    await prisma.resaleContact.create({
      data: {
        resaleId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const contact2 = await prisma.resaleContact.create({
      data: {
        resaleId,
        departmentId,
        name: 'Maria',
        email: 'maria@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditResaleContactInputDto = {
      name: 'Maria',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(contact2.id, data)).rejects.toThrow(ResaleContactAlreadyExistsError);
  });

  it('should allow edit when email belongs to the same contact being edited', async() => {
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
    const data: EditResaleContactInputDto = {
      name: 'João Silva',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await sut.execute(resaleContact.id, data);

    const updated = await prisma.resaleContact.findUnique({
      where: { id: resaleContact.id },
    });
    expect(updated?.name).toBe('João Silva');
  });

  it('should throw InvalidEmailError when email is invalid', async() => {
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
    const data: EditResaleContactInputDto = {
      name: 'João',
      departmentId,
      email: 'invalid-email',
      receiveNF: false,
    };

    await expect(sut.execute(resaleContact.id, data)).rejects.toThrow(InvalidEmailError);
  });

  it('should throw InvalidPhoneError when phone is invalid', async() => {
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
    const data: EditResaleContactInputDto = {
      name: 'João',
      departmentId,
      email: 'joao@example.com',
      phone: '123',
      receiveNF: false,
    };

    await expect(sut.execute(resaleContact.id, data)).rejects.toThrow(InvalidPhoneError);
  });

  it('should throw DepartmentNotFoundError when department does not exist', async() => {
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
    const data: EditResaleContactInputDto = {
      name: 'João',
      departmentId: 99999,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(resaleContact.id, data)).rejects.toThrow(
      DepartmentNotFoundError,
    );
  });

  it('should throw DepartmentNotFoundError when department is inactive', async() => {
    const inactiveDept = await prisma.department.create({
      data: { name: `Inactive ${Date.now()}`, active: false },
    });
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
    const data: EditResaleContactInputDto = {
      name: 'João',
      departmentId: inactiveDept.id,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(resaleContact.id, data)).rejects.toThrow(
      DepartmentNotFoundError,
    );
  });
});
