import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
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

    await prisma.truncate();
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('integration tests', () => {
    let owner01: Owner;
    let owner02: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: { id: 'owner-456', active: true },
      });
      owner02 = await prisma.owner.create({
        data: { id: 'owner-789', active: true },
      });

      data = {
        name: 'Jane Smith',
        department: 'Marketing',
        email: 'jane.smith@example.com',
        phone: '987-654-3210',
        whatsapp: '987-654-3210',
        ownerId: owner01.id,
        info: 'Additional information about Jane Smith',
      };
    });

    it('should return an empty array if there is no contact', async() => {
      // Act
      const contacts = await sut.execute({ ownerId: data.ownerId });

      // Assert
      expect(contacts).toEqual<IPagination<ContactDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all contacts', async() => {
      // Arrange
      await createContact.execute({ ...data, department: 'DP1' });
      await createContact.execute({ ...data, department: 'DP2' });
      await createContact.execute({ ...data, department: 'DP3' });

      // Act
      const contacts = await sut.execute({ ownerId: data.ownerId });

      // Assert
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
      // Arrange
      await createContact.execute({ ...data, department: 'DP1' });
      await createContact.execute({ ...data, department: 'DP2' });
      await createContact.execute({ ...data, department: 'DP3' });

      // Act
      const contacts = await sut.execute({ page: 2, size: 2, ownerId: data.ownerId });

      // Assert
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
      // Arrange
      await createContact.execute({ ...data, ownerId: owner01.id, department: 'DP1' });
      await createContact.execute({ ...data, ownerId: owner02.id, department: 'DP2' });
      await createContact.execute({ ...data, ownerId: owner01.id, department: 'DP3' });

      // Act
      const contacts = await sut.execute({ ownerId: owner01.id });

      // Assert
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
      // Arrange
      await createContact.execute({ ...data, ownerId: owner01.id, department: 'DP1' });
      await createContact.execute({ ...data, ownerId: owner02.id, department: 'DP2' });

      // Act
      const contacts = await sut.execute({ ownerId: 'non-existing-owner' });

      // Assert
      expect(contacts).toEqual<IPagination<ContactDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return contacts ordered by name ascending', async() => {
      // Arrange
      await createContact.execute({ ...data, name: 'Charlie', department: 'DP1' });
      await createContact.execute({ ...data, name: 'Alice', department: 'DP2' });
      await createContact.execute({ ...data, name: 'Bob', department: 'DP3' });

      // Act
      const contacts = await sut.execute({ ownerId: data.ownerId });

      // Assert
      expect(contacts.data.map(c => c.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });
});
