import { Test } from '@nestjs/testing';
import { ClientDepartmentNotFoundError } from 'src/app/client/client-department/domain/errors/client-department-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import { ClientContactModule } from '../../../client-contact.module';
import { ClientContactAlreadyExistsError } from '../../../domain/errors/client-contact-already-exists.error';
import { CreateClientContact } from './create-client-contact.service';
import { CreateClientContactInputDto } from './dtos/create-client-contact.dto';

describe('CreateClientContact - Integration tests', () => {
  let sut: CreateClientContact;
  let prisma: PrismaService;
  let clientId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientContactModule],
    }).compile();

    sut = module.get(CreateClientContact);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner, department] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.clientDepartment.create({ data: { name: `Dept ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
    departmentId = department.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientContactAlreadyExistsError when creating with duplicate email for same client', async() => {
    const input: CreateClientContactInputDto = {
      clientId,
      departmentId,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientContactAlreadyExistsError);
  });

  it('should allow same email for different clients', async() => {
    const [group2, owner2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);
    const client2 = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group2.id,
        ownerId: owner2.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'Rio',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const input1: CreateClientContactInputDto = {
      clientId,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };
    const input2: CreateClientContactInputDto = {
      clientId: client2.id,
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
    const input: CreateClientContactInputDto = {
      clientId,
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
    const input: CreateClientContactInputDto = {
      clientId,
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
    const input: CreateClientContactInputDto = {
      clientId,
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

  it('should throw ClientNotFoundError when client does not exist', async() => {
    const input: CreateClientContactInputDto = {
      clientId: 99999,
      departmentId,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw ClientDepartmentNotFoundError when department does not exist', async() => {
    const input: CreateClientContactInputDto = {
      clientId,
      departmentId: 99999,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientDepartmentNotFoundError);
  });

  it('should throw ClientDepartmentNotFoundError when department is inactive', async() => {
    const inactiveDept = await prisma.clientDepartment.create({
      data: { name: `Inactive ${Date.now()}`, active: false },
    });
    const input: CreateClientContactInputDto = {
      clientId,
      departmentId: inactiveDept.id,
      name: 'João',
      email: 'joao@example.com',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    await expect(sut.execute(input)).rejects.toThrow(ClientDepartmentNotFoundError);
  });

  it('should create client contact and return id', async() => {
    const input: CreateClientContactInputDto = {
      clientId,
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

    const saved = await prisma.clientContact.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.email).toBe('joao@example.com');
    expect(saved?.receiveNF).toBe(false);
  });

  it('should persist email in lowercase', async() => {
    const input: CreateClientContactInputDto = {
      clientId,
      departmentId,
      name: 'João',
      email: 'Joao@Example.COM',
      phone: null,
      whatsapp: null,
      observations: null,
      receiveNF: false,
    };

    const { id } = await sut.execute(input);

    const saved = await prisma.clientContact.findUnique({ where: { id } });
    expect(saved?.email).toBe('joao@example.com');
  });

  it('should validate email with VO before checking uniqueness', async() => {
    const input: CreateClientContactInputDto = {
      clientId,
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
