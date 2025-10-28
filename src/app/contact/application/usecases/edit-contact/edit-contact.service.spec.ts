import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContactModule } from 'src/app/contact/contact.module';
import { ContactNotFoundError } from 'src/app/contact/domain/errors/contact-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ContactDto } from '../../dtos/contact.dto';
import { CreateContact } from '../create-contact/create-contact.service';
import { CreateContactInputDto } from '../create-contact/dtos/create-contact.dto';
import { FindContactById } from '../find-contact-by-id/find-contact-by-id.service';
import { EditContactInputDto } from './dtos/edit-contact.dto';
import { EditContact } from './edit-contact.service';

describe('EditContact', () => {
  let sut: EditContact;
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

    sut = module.get(EditContact);
    prisma = module.get(PrismaService);
    createContact = module.get(CreateContact);
    findContactById = module.get(FindContactById);

    await prisma.contact.deleteMany();
  });

  afterAll(async() => {
    await prisma.contact.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call contactDao.edit with correct values', async() => {
      // Arrange
      const id = 'contact-id-1';
      const contact = createMock<ContactDto>({ id });
      const input = createMock<EditContactInputDto>();
      const contactDaoSpy = jest.spyOn(sut['contactDao'], 'edit').mockResolvedValue();
      jest.spyOn(sut['contactDao'], 'findById').mockResolvedValue(contact);

      // Act
      await sut.execute(id, input);

      // Assert
      expect(contactDaoSpy).toHaveBeenCalledWith(contact.id, input);
    });

    it('should return a success message on successful edit', async() => {
      const contact = createMock<ContactDto>();
      jest.spyOn(sut['contactDao'], 'findById').mockResolvedValue(contact);
      jest.spyOn(sut['contactDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(contact.id, {});

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Contato atualizado com sucesso!' });
    });
  });

  it('should throw an error if contact does not exist', async() => {
    // Arrange
    const data = createMock<EditContactInputDto>();

    // Act & Assert
    expect.assertions(1);
    return sut.execute('non-existing-id', data).catch((error) => {
      expect(error).toBeInstanceOf(ContactNotFoundError);
    });
  });

  it('should edit a contact with partial data', async() => {
    // Arrange
    const createData: CreateContactInputDto = {
      name: 'John Doe',
      department: 'TI',
      email: 'john.doe@example.com',
      phone: '123456789',
      whatsapp: '987654321',
      ownerId: 'owner-id-1',
      info: 'Some info about John Doe',
    };
    const createdContact = await createContact.execute(createData);

    // Act
    const contactEdit: EditContactInputDto = {
      name: 'Jane Doe',
      phone: '987654321',
      whatsapp: '123456789',
    };
    await sut.execute(createdContact.id, contactEdit);

    // Assert
    const editedContact = await findContactById.execute(createdContact.id);
    expect(editedContact).toBeDefined();
    expect(editedContact).toEqual<ContactDto>({
      id: createdContact.id,
      ownerId: createData.ownerId,
      name: contactEdit.name ?? createData.name,
      department: contactEdit.department ?? createData.department,
      email: contactEdit.email ?? createData.email,
      phone: contactEdit.phone ?? createData.phone,
      whatsapp: contactEdit.whatsapp ?? createData.whatsapp,
      info: contactEdit.info ?? createData.info,
      createdAt: editedContact.createdAt,
      updatedAt: editedContact.updatedAt,
    });
  });

  it('should edit a contact providing null values', async() => {
    // Arrange
    const createData: CreateContactInputDto = {
      name: 'John Doe',
      department: 'TI',
      email: 'john.doe@example.com',
      phone: '123456789',
      whatsapp: '987654321',
      ownerId: 'owner-id-1',
      info: 'Some info about John Doe',
    };
    const createdContact = await createContact.execute(createData);

    // Act
    const contactEdit: EditContactInputDto = {
      info: null,
    };
    await sut.execute(createdContact.id, contactEdit);

    // Assert
    const editedContact = await findContactById.execute(createdContact.id);
    expect(editedContact).toBeDefined();
    expect(editedContact).toEqual<ContactDto>({
      ...createData,
      info: null,
      id: createdContact.id,
      createdAt: editedContact.createdAt,
      updatedAt: editedContact.updatedAt,
    });
  });
});
