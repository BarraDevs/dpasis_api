import { Test } from '@nestjs/testing';
import { ClientDepartmentNotFoundError } from 'src/app/client/client-department/domain/errors/client-department-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import { ClientContactModule } from '../../../client-contact.module';
import { ClientContactAlreadyExistsError } from '../../../domain/errors/client-contact-already-exists.error';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import { EditClientContactInputDto } from './dtos/edit-client-contact.dto';
import { EditClientContact } from './edit-client-contact.service';

describe('EditClientContact - Integration tests', () => {
  let sut: EditClientContact;
  let prisma: PrismaService;
  let clientId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientContactModule],
    }).compile();

    sut = module.get(EditClientContact);
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

  it('should throw ClientContactNotFoundError when client contact does not exist', async() => {
    const data: EditClientContactInputDto = {
      name: 'João',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(99999, data)).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should update client contact', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João Silva',
      departmentId,
      email: 'joao.silva@example.com',
      receiveNF: true,
    };

    await sut.execute(clientContact.id, data);

    const updated = await prisma.clientContact.findUnique({
      where: { id: clientContact.id },
    });
    expect(updated?.name).toBe('João Silva');
    expect(updated?.email).toBe('joao.silva@example.com');
    expect(updated?.receiveNF).toBe(true);
  });

  it('should return success message', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João Silva',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    const result = await sut.execute(clientContact.id, data);

    expect(result).toEqual({ message: 'Contato de cliente atualizado com sucesso' });
  });

  it('should throw ClientContactAlreadyExistsError when editing to duplicate email for same client', async() => {
    await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const contact2 = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'Maria',
        email: 'maria@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'Maria',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(contact2.id, data)).rejects.toThrow(ClientContactAlreadyExistsError);
  });

  it('should allow edit when email belongs to the same contact being edited', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João Silva',
      departmentId,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await sut.execute(clientContact.id, data);

    const updated = await prisma.clientContact.findUnique({
      where: { id: clientContact.id },
    });
    expect(updated?.name).toBe('João Silva');
  });

  it('should throw InvalidEmailError when email is invalid', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João',
      departmentId,
      email: 'invalid-email',
      receiveNF: false,
    };

    await expect(sut.execute(clientContact.id, data)).rejects.toThrow(InvalidEmailError);
  });

  it('should throw InvalidPhoneError when phone is invalid', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João',
      departmentId,
      email: 'joao@example.com',
      phone: '123',
      receiveNF: false,
    };

    await expect(sut.execute(clientContact.id, data)).rejects.toThrow(InvalidPhoneError);
  });

  it('should throw ClientDepartmentNotFoundError when department does not exist', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João',
      departmentId: 99999,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(clientContact.id, data)).rejects.toThrow(
      ClientDepartmentNotFoundError,
    );
  });

  it('should throw ClientDepartmentNotFoundError when department is inactive', async() => {
    const inactiveDept = await prisma.clientDepartment.create({
      data: { name: `Inactive ${Date.now()}`, active: false },
    });
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });
    const data: EditClientContactInputDto = {
      name: 'João',
      departmentId: inactiveDept.id,
      email: 'joao@example.com',
      receiveNF: false,
    };

    await expect(sut.execute(clientContact.id, data)).rejects.toThrow(
      ClientDepartmentNotFoundError,
    );
  });
});
