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

  it('should throw an error if contact does not exist', async() => {
    const data = createMock<EditContactInputDto>();

    expect.assertions(1);
    return sut.execute('non-existing-id', data).catch((error) => {
      expect(error).toBeInstanceOf(ContactNotFoundError);
    });
  });

  it('should edit a contact', async() => {
    const contactCreate: CreateContactInputDto = {
      name: 'John Doe',
      department: 'TI',
      email: 'john.doe@example.com',
      phone: '123456789',
      whatsapp: '987654321',
      ownerId: 'owner-id-1',
      info: 'Some info about John Doe',
    };
    const createdContact = await createContact.execute(contactCreate);

    const contactEdit: EditContactInputDto = {
      name: 'Jane Doe',
      department: 'HR',
      email: 'jane.doe@example.com',
      phone: '987654321',
      whatsapp: '123456789',
      info: 'Some info about Jane Doe',
    };
    const result = await sut.execute(createdContact.id, contactEdit);
    expect(result).toEqual<SuccessMessage>({ message: 'Contato atualizado com sucesso!' });

    const editedContact = await findContactById.execute(createdContact.id);
    expect(editedContact).toBeDefined();
    expect(editedContact).toEqual<ContactDto>({
      id: createdContact.id,
      ownerId: contactCreate.ownerId,
      name: contactEdit.name,
      department: contactEdit.department,
      email: contactEdit.email,
      phone: contactEdit.phone,
      whatsapp: contactEdit.whatsapp,
      info: contactEdit.info || null,
      createdAt: editedContact.createdAt,
      updatedAt: editedContact.updatedAt,
    });
  });

  it('should call contactDao.edit with correct values', async() => {
    const id = 'contact-id-1';
    const contact = createMock<ContactDto>({ id });
    const input = createMock<EditContactInputDto>();
    jest.spyOn(sut['contactDao'], 'findById').mockResolvedValue(contact);

    const contactDaoSpy = jest.spyOn(sut['contactDao'], 'edit').mockResolvedValue();

    await sut.execute(id, input);

    expect(contactDaoSpy).toHaveBeenCalledWith(contact.id, input);
  });
});
