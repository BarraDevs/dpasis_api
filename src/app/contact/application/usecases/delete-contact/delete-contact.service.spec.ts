import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { ContactModule } from 'src/app/contact/contact.module';
import { ContactNotFoundError } from 'src/app/contact/domain/errors/contact-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ContactDto } from '../../dtos/contact.dto';
import { CreateContact } from '../create-contact/create-contact.service';
import { FindContactById } from '../find-contact-by-id/find-contact-by-id.service';
import { DeleteContact } from './delete-contact.service';

describe('DeleteContact', () => {
  let sut: DeleteContact;
  let prisma: PrismaService;
  let createContact: CreateContact;
  let findContactById: FindContactById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ContactModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(DeleteContact);
    prisma = module.get(PrismaService);
    createContact = module.get(CreateContact);
    findContactById = module.get(FindContactById);

    await prisma.owner.deleteMany();
    await prisma.contact.deleteMany();
  });

  afterEach(async() => {
    await prisma.owner.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call contactDao.delete with correct values', async() => {
      // Arrange
      const id = 'contact-id-123';
      const contact = createMock<ContactDto>();
      const deleteSpy = jest.spyOn(sut['contactDao'], 'delete').mockResolvedValue();
      jest.spyOn(sut['contactDao'], 'findById').mockResolvedValue(contact);

      // Act
      await sut.execute(id);

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('integration tests', () => {
    let owner: Owner;

    beforeEach(async() => {
      owner = await prisma.owner.create({
        data: {
          id: 'owner-1',
          active: true,
        },
      });
    });

    it('should throw an error if contact does not exist', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existing-id').catch((error) => {
        expect(error).toBeInstanceOf(ContactNotFoundError);
      });
    });

    it('should delete a contact', async() => {
      // Arrange
      const createdContact = await createContact.execute({
        name: 'John Doe',
        department: 'Sales',
        email: 'john.doe@example.com',
        phone: '1234567890',
        whatsapp: '1234567890',
        ownerId: owner.id,
        info: null,
      });

      // Act
      await sut.execute(createdContact.id);

      // Assert
      expect.assertions(1);
      return findContactById.execute(createdContact.id).catch((error) => {
        expect(error).toBeInstanceOf(ContactNotFoundError);
      });
    });

    it('should return success message upon deletion', async() => {
      // Arrange
      const createdContact = await createContact.execute({
        name: 'Jane Smith',
        department: 'Marketing',
        email: 'jane.smith@example.com',
        phone: '0987654321',
        whatsapp: '0987654321',
        ownerId: owner.id,
        info: null,
      });

      // Act
      const result = await sut.execute(createdContact.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Contato deletado com sucesso!' });
    });
  });
});
