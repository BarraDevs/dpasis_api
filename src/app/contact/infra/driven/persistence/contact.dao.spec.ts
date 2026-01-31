import { Test } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { ContactPersistenceModule } from 'src/app/contact/application/persistence/contact-persistence.module';
import { CreateContactInputDto } from 'src/app/contact/application/usecases/create-contact/dtos/create-contact.dto';
import { EditContactInputDto } from 'src/app/contact/application/usecases/edit-contact/dtos/edit-contact.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ContactDaoAdapterPrisma } from './contact.dao';

describe('ContactDaoAdapterPrisma', () => {
  let sut: ContactDaoAdapterPrisma;
  let prisma: PrismaService;
  let owner01: Owner;
  let owner02: Owner;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ContactPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ContactDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ContactDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();

    // Create owners for contact ownership
    owner01 = await prisma.owner.create({
      data: {
        id: 'owner-contact-dao-01',
        active: true,
      },
    });
    owner02 = await prisma.owner.create({
      data: {
        id: 'owner-contact-dao-02',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save a contact and return its id', async() => {
      // Arrange
      const data: CreateContactInputDto = {
        name: 'John Doe',
        phone: '(11) 98765-4321',
        email: 'john.doe@example.com',
        department: 'Sales',
        info: 'Additional information about John Doe',
        whatsapp: '(11) 98765-4321',
        ownerId: owner01.id,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toEqual(expect.any(String));
      const savedContact = await prisma.contact.findUnique({ where: { id } });
      expect(savedContact).toBeDefined();
      expect(savedContact?.name).toBe(data.name);
      expect(savedContact?.phone).toBe(data.phone);
      expect(savedContact?.email).toBe(data.email);
      expect(savedContact?.department).toBe(data.department);
      expect(savedContact?.info).toBe(data.info);
      expect(savedContact?.whatsapp).toBe(data.whatsapp);
      expect(savedContact?.ownerId).toBe(data.ownerId);
    });

    it('should save a contact with email', async() => {
      // Arrange
      const data: CreateContactInputDto = {
        name: 'Alice Johnson',
        phone: '(31) 99876-5432',
        department: 'Sales',
        whatsapp: '(31) 99876-5432',
        info: 'Additional information about Alice Johnson',
        email: 'alice.johnson@test.com',
        ownerId: owner02.id,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      const savedContact = await prisma.contact.findUnique({ where: { id } });
      expect(savedContact?.email).toBe(data.email);
      expect(savedContact?.ownerId).toBe(owner02.id);
    });

    it('should save multiple contacts for the same owner', async() => {
      // Arrange
      const data1: CreateContactInputDto = {
        name: 'Contact One',
        phone: '(11) 11111-1111',
        department: 'Sales',
        email: 'contactone@test.com',
        whatsapp: '(11) 11111-1111',
        info: 'Additional information about Contact One',
        ownerId: owner01.id,
      };
      const data2: CreateContactInputDto = {
        name: 'Contact Two',
        phone: '(11) 22222-2222',
        department: 'Sales',
        email: 'contacttwo@test.com',
        whatsapp: '(11) 22222-2222',
        info: 'Additional information about Contact Two',
        ownerId: owner01.id,
      };

      // Act
      const id1 = await sut.save(data1);
      const id2 = await sut.save(data2);

      // Assert
      expect(id1).not.toBe(id2);
      const contacts = await prisma.contact.findMany({ where: { ownerId: owner01.id } });
      expect(contacts).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Seed data for findAll tests
      await prisma.contact.createMany({
        data: [
          { name: 'Alice Brown', phone: '(11) 11111-1111', email: 'alice@test.com', department: 'Sales', whatsapp: '(11) 11111-1111', info: 'Additional information about Alice Brown', ownerId: owner01.id },
          { name: 'Bob Smith', phone: '(11) 22222-2222', email: 'bob@test.com', department: 'Sales', whatsapp: '(11) 22222-2222', info: 'Additional information about Bob Smith', ownerId: owner01.id },
          { name: 'Charlie Davis', phone: '(11) 33333-3333', department: 'Sales', email: 'charlie@test.com', whatsapp: '(11) 33333-3333', info: 'Additional information about Charlie Davis', ownerId: owner01.id },
          { name: 'David Wilson', phone: '(11) 44444-4444', email: 'david@test.com', department: 'Sales', whatsapp: '(11) 44444-4444', info: 'Additional information about David Wilson', ownerId: owner01.id },
          { name: 'Eve Martinez', phone: '(11) 55555-5555', department: 'Sales', email: 'eve@test.com', whatsapp: '(11) 55555-5555', info: 'Additional information about Eve Martinez', ownerId: owner01.id },
          { name: 'Frank Johnson', phone: '(11) 66666-6666', email: 'frank@test.com', department: 'Sales', whatsapp: '(11) 66666-6666', info: 'Additional information about Frank Johnson', ownerId: owner02.id },
          { name: 'Grace Lee', phone: '(11) 77777-7777', department: 'Sales', email: 'grace@test.com', whatsapp: '(11) 77777-7777', info: 'Additional information about Grace Lee', ownerId: owner02.id },
        ],
      });
    });

    it('should return all contacts for a specific owner', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: owner01.id });

      // Assert
      expect(total).toBe(5);
      expect(contacts).toHaveLength(5);
      expect(contacts.every(c => c.ownerId === owner01.id)).toBe(true);
    });

    it('should return contacts ordered by name ascending', async() => {
      // Act
      const [contacts] = await sut.findAll({ ownerId: owner01.id });

      // Assert
      expect(contacts).toHaveLength(5);
      expect(contacts[0].name).toBe('Alice Brown');
      expect(contacts[1].name).toBe('Bob Smith');
      expect(contacts[2].name).toBe('Charlie Davis');
      expect(contacts[3].name).toBe('David Wilson');
      expect(contacts[4].name).toBe('Eve Martinez');
    });

    it('should return paginated contacts', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: owner01.id, page: 1, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('Alice Brown');
      expect(contacts[1].name).toBe('Bob Smith');
    });

    it('should return second page of paginated contacts', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: owner01.id, page: 2, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('Charlie Davis');
      expect(contacts[1].name).toBe('David Wilson');
    });

    it('should return last page of paginated contacts', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: owner01.id, page: 3, size: 2 });

      // Assert
      expect(total).toBe(5);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Eve Martinez');
    });

    it('should return empty if ownerId has no contacts', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: 'non-existing-owner' });

      // Assert
      expect(total).toBe(0);
      expect(contacts).toHaveLength(0);
    });

    it('should return contacts only for the specified owner', async() => {
      // Act
      const [contactsOwner02, total] = await sut.findAll({ ownerId: owner02.id });

      // Assert
      expect(total).toBe(2);
      expect(contactsOwner02).toHaveLength(2);
      expect(contactsOwner02.every(c => c.ownerId === owner02.id)).toBe(true);
      expect(contactsOwner02[0].name).toBe('Frank Johnson');
      expect(contactsOwner02[1].name).toBe('Grace Lee');
    });

    it('should handle pagination with size larger than total contacts', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: owner01.id, page: 1, size: 100 });

      // Assert
      expect(total).toBe(5);
      expect(contacts).toHaveLength(5);
    });

    it('should return empty array when page exceeds available data', async() => {
      // Act
      const [contacts, total] = await sut.findAll({ ownerId: owner01.id, page: 10, size: 10 });

      // Assert
      expect(total).toBe(5);
      expect(contacts).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return null if contact not found', async() => {
      // Act
      const contact = await sut.findById('non-existing-id');

      // Assert
      expect(contact).toBeNull();
    });

    it('should return the correct contact if found', async() => {
      // Arrange
      const created = await prisma.contact.create({
        data: {
          name: 'Find Me',
          phone: '(11) 99999-9999',
          email: 'findme@test.com',
          department: 'Sales',
          whatsapp: '(11) 99999-9999',
          info: 'Additional information about Find Me',
          ownerId: owner01.id,
        },
      });

      // Act
      const contact = await sut.findById(created.id);

      // Assert
      expect(contact).not.toBeNull();
      expect(contact?.id).toBe(created.id);
      expect(contact?.name).toBe('Find Me');
      expect(contact?.phone).toBe('(11) 99999-9999');
      expect(contact?.email).toBe('findme@test.com');
    });
  });

  describe('edit', () => {
    it('should update the contact name', async() => {
      // Arrange
      const created = await prisma.contact.create({
        data: {
          name: 'Old Name',
          phone: '(11) 12345-6789',
          email: 'old@test.com',
          department: 'Sales',
          whatsapp: '(11) 12345-6789',
          info: 'Additional information about Old Name',
          ownerId: owner01.id,
        },
      });
      const editData: EditContactInputDto = {
        name: 'New Name',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedContact = await prisma.contact.findUnique({ where: { id: created.id } });
      expect(updatedContact).toBeDefined();
      expect(updatedContact?.name).toBe(editData.name);
      // Unchanged fields
      expect(updatedContact?.phone).toBe('(11) 12345-6789');
      expect(updatedContact?.email).toBe('old@test.com');
    });

    it('should update the contact phone', async() => {
      // Arrange
      const created = await prisma.contact.create({
        data: {
          name: 'Test Contact',
          phone: '(11) 11111-1111',
          department: 'Sales',
          email: 'test@test.com',
          whatsapp: '(11) 11111-1111',
          info: 'Additional information about Test Contact',
          ownerId: owner01.id,
        },
      });
      const editData: EditContactInputDto = {
        phone: '(21) 99999-9999',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedContact = await prisma.contact.findUnique({ where: { id: created.id } });
      expect(updatedContact?.phone).toBe(editData.phone);
      expect(updatedContact?.name).toBe('Test Contact');
    });

    it('should update the contact email', async() => {
      // Arrange
      const created = await prisma.contact.create({
        data: {
          name: 'Email Update Test',
          phone: '(11) 22222-2222',
          email: 'old.email@test.com',
          department: 'Sales',
          whatsapp: '(11) 22222-2222',
          info: 'Additional information about Email Update Test',
          ownerId: owner01.id,
        },
      });
      const editData: EditContactInputDto = {
        email: 'new.email@test.com',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedContact = await prisma.contact.findUnique({ where: { id: created.id } });
      expect(updatedContact?.email).toBe(editData.email);
    });

    it('should update all contact fields when all are provided', async() => {
      // Arrange
      const created = await prisma.contact.create({
        data: {
          name: 'Original Name',
          phone: '(11) 33333-3333',
          email: 'original@test.com',
          department: 'Sales',
          whatsapp: '(11) 33333-3333',
          info: 'Additional information about Original Name',
          ownerId: owner01.id,
        },
      });
      const editData: EditContactInputDto = {
        name: 'Updated Name',
        phone: '(21) 44444-4444',
        email: 'updated@test.com',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedContact = await prisma.contact.findUnique({ where: { id: created.id } });
      expect(updatedContact).toBeDefined();
      expect(updatedContact?.name).toBe(editData.name);
      expect(updatedContact?.phone).toBe(editData.phone);
      expect(updatedContact?.email).toBe(editData.email);
      expect(updatedContact?.ownerId).toBe(owner01.id); // Unchanged
    });

    it('should throw error if contact does not exist (Prisma handles this)', async() => {
      // Arrange
      const editData: EditContactInputDto = { name: 'Non-existing Contact' };

      // Act & Assert
      await expect(sut.edit('non-existing-id', editData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete the contact', async() => {
      // Arrange
      const created = await prisma.contact.create({
        data: {
          name: 'To Be Deleted',
          phone: '(11) 66666-6666',
          email: 'delete@test.com',
          department: 'Sales',
          whatsapp: '(11) 66666-6666',
          info: 'Additional information about To Be Deleted',
          ownerId: owner01.id,
        },
      });

      // Act
      await sut.delete(created.id);

      // Assert
      const deletedContact = await prisma.contact.findUnique({ where: { id: created.id } });
      expect(deletedContact).toBeNull();
    });

    it('should throw error if contact does not exist (Prisma handles this)', async() => {
      // Act & Assert
      await expect(sut.delete('non-existing-id')).rejects.toThrow();
    });

    it('should not affect other contacts when deleting one', async() => {
      // Arrange
      const contact1 = await prisma.contact.create({
        data: {
          name: 'Contact 1',
          phone: '(11) 11111-1111',
          ownerId: owner01.id,
          department: 'Sales',
          email: 'contact1@test.com',
          whatsapp: '(11) 11111-1111',
          info: 'Additional information about Contact 1',
        },
      });
      const contact2 = await prisma.contact.create({
        data: {
          name: 'Contact 2',
          phone: '(11) 22222-2222',
          ownerId: owner01.id,
          department: 'Sales',
          email: 'contact2@test.com',
          whatsapp: '(11) 22222-2222',
          info: 'Additional information about Contact 2',
        },
      });

      // Act
      await sut.delete(contact1.id);

      // Assert
      const remainingContact = await prisma.contact.findUnique({ where: { id: contact2.id } });
      expect(remainingContact).not.toBeNull();
      expect(remainingContact?.name).toBe('Contact 2');

      const deletedContact = await prisma.contact.findUnique({ where: { id: contact1.id } });
      expect(deletedContact).toBeNull();
    });
  });

});
