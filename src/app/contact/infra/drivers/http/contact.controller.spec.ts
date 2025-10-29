import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CreateContactInputDto, CreateContactOutputDto } from 'src/app/contact/application/usecases/create-contact/dtos/create-contact.dto';
import { EditContactInputDto } from 'src/app/contact/application/usecases/edit-contact/dtos/edit-contact.dto';
import { FindAllContactQueryDto } from 'src/app/contact/application/usecases/find-all-contact/dtos/find-all-contact.dto';
import { ContactModule } from 'src/app/contact/contact.module';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { ContactController } from './contact.controller';

describe('ContactController', () => {
  let sut: ContactController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ContactModule,
      ],
    }).compile();

    sut = module.get(ContactController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createContactService.execute with correct values', async() => {
      // Arrange
      const input = createMock<CreateContactInputDto>();
      const output = createMock<CreateContactOutputDto>();
      const createContactService = jest.spyOn(sut['createContactService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createContactService).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllContactService.execute with correct values', async() => {
      // Arrange
      const queries = createMock<FindAllContactQueryDto>();
      const findAllContactService = jest.spyOn(sut['findAllContactService'], 'execute').mockResolvedValueOnce(createMock());

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllContactService).toHaveBeenCalledWith(queries);
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should call findContactByIdService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>();
      const findContactByIdService = jest.spyOn(sut['findContactByIdService'], 'execute').mockResolvedValueOnce(createMock());

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findContactByIdService).toHaveBeenCalledWith(params.id);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should call editContactService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditContactInputDto>();
      const editContactService = jest.spyOn(sut['editContactService'], 'execute').mockResolvedValueOnce(createMock());

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editContactService).toHaveBeenCalledWith(params.id, body);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should call deleteContactService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>();
      const deleteContactService = jest.spyOn(sut['deleteContactService'], 'execute').mockResolvedValueOnce(createMock());

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(deleteContactService).toHaveBeenCalledWith(params.id);
      expect(result).toBeDefined();
    });
  });
});
