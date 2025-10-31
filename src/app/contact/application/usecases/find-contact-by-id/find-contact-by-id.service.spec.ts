import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContactModule } from 'src/app/contact/contact.module';
import { ContactNotFoundError } from 'src/app/contact/domain/errors/contact-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ContactDto } from '../../dtos/contact.dto';
import { CreateContact } from '../create-contact/create-contact.service';
import { CreateContactInputDto } from '../create-contact/dtos/create-contact.dto';
import { FindContactById } from './find-contact-by-id.service';

describe('FindContactById', () => {
  let sut: FindContactById;
  let prisma: PrismaService;
  let createContact: CreateContact;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ContactModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindContactById);
    prisma = module.get(PrismaService);
    createContact = module.get(CreateContact);

    await prisma.owner.deleteMany();
    await prisma.contact.deleteMany();
  });

  afterAll(async() => {
    await prisma.owner.deleteMany();
    await prisma.contact.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call contactDao.findById with correct parameters', async() => {
      // Arrange
      const contact = createMock<ContactDto>();
      const spy = jest.spyOn(sut['contactDao'], 'findById').mockResolvedValue(contact);

      // Act
      await sut.execute('existing-id');

      // Assert
      expect(spy).toHaveBeenCalledWith('existing-id');
    });
  });

  describe('integration tests', () => {
    it('should throw an error if contact is not found', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existing-id').catch((error) => {
        expect(error).toBeInstanceOf(ContactNotFoundError);
      });
    });

    it('should return a contact if found', async() => {
      const owner = await prisma.owner.create({
        data: {
          id: 'owner-123',
        },
      });

      // Arrange
      const data: CreateContactInputDto = {
        name: 'John Doe',
        department: 'Sales',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        whatsapp: '123-456-7890',
        ownerId: owner.id,
        info: 'Additional info about John Doe',
      };
      const createdContact = await createContact.execute(data);

      // Act
      const foundContact = await sut.execute(createdContact.id);

      // Assert
      expect(foundContact).toBeDefined();
      expect(foundContact).toEqual<ContactDto>({
        id: createdContact.id,
        name: data.name,
        department: data.department,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        ownerId: data.ownerId,
        info: data.info || null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
