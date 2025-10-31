import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { ContactModule } from 'src/app/contact/contact.module';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ContactDto } from '../../dtos/contact.dto';
import { FindContactById } from '../find-contact-by-id/find-contact-by-id.service';
import { CreateContact } from './create-contact.service';
import { CreateContactInputDto, CreateContactOutputDto } from './dtos/create-contact.dto';

describe('CreateContact', () => {
  let sut: CreateContact;
  let prisma: PrismaService;
  let findContactById: FindContactById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ContactModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateContact);
    prisma = module.get(PrismaService);
    findContactById = module.get(FindContactById);

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
    it('should call contactDao.save with correct values', async() => {
      // Arrange
      const id = 'contact-id-123';
      const input = createMock<CreateContactInputDto>();
      const contactDaoSpy = jest.spyOn(sut['contactDao'], 'save').mockResolvedValue(id);

      const owner = createMock<Owner>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      await sut.execute(input);

      // Assert
      expect(contactDaoSpy).toHaveBeenCalledWith({ ...input, ownerId: owner.id });
    });

    it('should return correct output dto', async() => {
      // Arrange
      const id = 'contact-id-123';
      const input = createMock<CreateContactInputDto>();
      jest.spyOn(sut['contactDao'], 'save').mockResolvedValue(id);

      const owner = createMock<Owner>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual<CreateContactOutputDto>({ id });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-123',
        },
      });
    });

    it('should throw error when owner does not exist', async() => {
      // Arrange
      const input: CreateContactInputDto = {
        name: 'John Doe',
        department: 'Sales',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        whatsapp: '123-456-7890',
        ownerId: 'non-existent-owner',
        info: 'Additional information about John Doe',
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(OwnerNotFoundError);
    });

    it('should create a contact providing all fields', async() => {
      // Arrange
      const input: CreateContactInputDto = {
        name: 'John Doe',
        department: 'Sales',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        whatsapp: '123-456-7890',
        ownerId: owner01.id,
        info: 'Additional information about John Doe',
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdContact = await findContactById.execute(output.id);
      expect(createdContact).toEqual<ContactDto>({
        id: output.id,
        name: input.name,
        department: input.department,
        email: input.email,
        phone: input.phone,
        whatsapp: input.whatsapp,
        ownerId: input.ownerId,
        info: input.info!,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create a contact providing only required fields', async() => {
      // Arrange
      const input: CreateContactInputDto = {
        name: 'John Doe',
        department: 'Sales',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        whatsapp: '123-456-7890',
        ownerId: owner01.id,
        info: null,
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdContact = await findContactById.execute(output.id);
      expect(createdContact).toEqual<ContactDto>({
        id: output.id,
        name: input.name,
        department: input.department,
        email: input.email,
        phone: input.phone,
        whatsapp: input.whatsapp,
        ownerId: input.ownerId,
        info: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
