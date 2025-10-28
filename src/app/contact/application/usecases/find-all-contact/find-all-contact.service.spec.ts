import { Test, TestingModule } from '@nestjs/testing';
import { ContactModule } from 'src/app/contact/contact.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ContactDto } from '../../dtos/contact.dto';
import { CreateContact } from '../create-contact/create-contact.service';
import { CreateContactInputDto } from '../create-contact/dtos/create-contact.dto';
import { FindAllContact } from './find-all-contact.service';

describe('FindAllContact', () => {
  let sut: FindAllContact;
  let prisma: PrismaService;
  let createContact: CreateContact;
  let data: CreateContactInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ContactModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllContact);
    prisma = module.get(PrismaService);
    createContact = module.get(CreateContact);

    data = {
      name: 'Jane Smith',
      department: 'Marketing',
      email: 'jane.smith@example.com',
      phone: '987-654-3210',
      whatsapp: '987-654-3210',
      ownerId: 'owner-456',
      info: 'Additional information about Jane Smith',
    };

    await prisma.contact.deleteMany();
  });

  afterAll(async() => {
    await prisma.contact.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return an empty array if there is no contact', async() => {
    const contacts = await sut.execute({ ownerId: data.ownerId });

    expect(contacts).toEqual<IPagination<ContactDto>>({
      data: [],
      currentPage: 1,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('should return all contacts', async() => {
    await createContact.execute({ ...data, department: 'DP1' });
    await createContact.execute({ ...data, department: 'DP2' });
    await createContact.execute({ ...data, department: 'DP3' });

    const contacts = await sut.execute({ ownerId: data.ownerId });

    expect(contacts).toEqual<IPagination<ContactDto>>({
      data: expect.arrayContaining([
        expect.objectContaining({ department: 'DP1' }),
        expect.objectContaining({ department: 'DP2' }),
        expect.objectContaining({ department: 'DP3' }),
      ]),
      currentPage: 1,
      itemsPerPage: 3,
      totalItems: 3,
      totalPages: 1,
    });
  });

  it('should return paginated contacts', async() => {
    await createContact.execute({ ...data, department: 'DP1' });
    await createContact.execute({ ...data, department: 'DP2' });
    await createContact.execute({ ...data, department: 'DP3' });

    const contacts = await sut.execute({ page: 2, size: 2, ownerId: data.ownerId });

    expect(contacts).toEqual<IPagination<ContactDto>>({
      data: expect.arrayContaining([
        expect.objectContaining({ department: 'DP3' }),
      ]),
      currentPage: 2,
      itemsPerPage: 2,
      totalItems: 3,
      totalPages: 2,
    });
  });

  it('should return contacts filtered by ownerId', async() => {
    await createContact.execute({ ...data, ownerId: 'owner-1', department: 'DP1' });
    await createContact.execute({ ...data, ownerId: 'owner-2', department: 'DP2' });
    await createContact.execute({ ...data, ownerId: 'owner-1', department: 'DP3' });

    const contacts = await sut.execute({ ownerId: 'owner-1' });

    expect(contacts).toEqual<IPagination<ContactDto>>({
      data: expect.arrayContaining([
        expect.objectContaining({ department: 'DP1' }),
        expect.objectContaining({ department: 'DP3' }),
      ]),
      currentPage: 1,
      itemsPerPage: 2,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('should return empty array when filtering by non-existing ownerId', async() => {
    await createContact.execute({ ...data, ownerId: 'owner-1', department: 'DP1' });
    await createContact.execute({ ...data, ownerId: 'owner-2', department: 'DP2' });

    const contacts = await sut.execute({ ownerId: 'non-existing-owner' });

    expect(contacts).toEqual<IPagination<ContactDto>>({
      data: [],
      currentPage: 1,
      itemsPerPage: 0,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('should return contacts ordered by name ascending', async() => {
    await createContact.execute({ ...data, name: 'Charlie', department: 'DP1' });
    await createContact.execute({ ...data, name: 'Alice', department: 'DP2' });
    await createContact.execute({ ...data, name: 'Bob', department: 'DP3' });

    const contacts = await sut.execute({ ownerId: data.ownerId });

    expect(contacts.data.map(c => c.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });
});
