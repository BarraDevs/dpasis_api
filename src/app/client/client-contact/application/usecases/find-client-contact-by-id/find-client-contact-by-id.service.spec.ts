import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientContactModule } from '../../../client-contact.module';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import { ClientContactDto } from '../../dtos/client-contact.dto';
import { FindClientContactById } from './find-client-contact-by-id.service';

describe('FindClientContactById - Integration tests', () => {
  let sut: FindClientContactById;
  let prisma: PrismaService;
  let clientId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientContactModule],
    }).compile();

    sut = module.get(FindClientContactById);
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
    await expect(sut.execute(99999)).rejects.toThrow(ClientContactNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow(
      'Contato de cliente não encontrado na base de dados.',
    );
  });

  it('should return client contact by id', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
      },
    });

    const result = await sut.execute(clientContact.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(clientContact.id);
    expect(result.name).toBe(clientContact.name);
    expect(result.email).toBe(clientContact.email);
  });

  it('should return all client contact fields correctly', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        phone: '11999999999',
        whatsapp: '11988887777',
        observations: 'Observação',
        receiveNF: true,
      },
    });

    const result = await sut.execute(clientContact.id);

    expect(result).toEqual<ClientContactDto>({
      id: clientContact.id,
      clientId: clientContact.clientId,
      name: clientContact.name,
      departmentId: clientContact.departmentId,
      email: clientContact.email,
      phone: clientContact.phone,
      whatsapp: clientContact.whatsapp,
      observations: clientContact.observations,
      receiveNF: clientContact.receiveNF,
      createdAt: clientContact.createdAt,
      updatedAt: clientContact.updatedAt,
    });
  });
});
