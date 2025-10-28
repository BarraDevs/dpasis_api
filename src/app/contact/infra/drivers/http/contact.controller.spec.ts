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
      const input = createMock<CreateContactInputDto>();
      const output = createMock<CreateContactOutputDto>();
      const createContactService = jest.spyOn(sut['createContactService'], 'execute').mockResolvedValueOnce(output);

      const result = await sut.create(input);

      expect(createContactService).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllContactService.execute with correct values', async() => {
      const queries = createMock<FindAllContactQueryDto>();
      const findAllContactService = jest.spyOn(sut['findAllContactService'], 'execute').mockResolvedValueOnce(createMock());

      const result = await sut.findAll(queries);

      expect(findAllContactService).toHaveBeenCalledWith(queries);
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should call findContactByIdService.execute with correct values', async() => {
      const id = 'any_id';
      const findContactByIdService = jest.spyOn(sut['findContactByIdService'], 'execute').mockResolvedValueOnce(createMock());

      const result = await sut.findOne({ id });

      expect(findContactByIdService).toHaveBeenCalledWith(id);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should call editContactService.execute with correct values', async() => {
      const params = createMock<Params>();
      const body = createMock<EditContactInputDto>();
      const editContactService = jest.spyOn(sut['editContactService'], 'execute').mockResolvedValueOnce(createMock());

      const result = await sut.update(params, body);

      expect(editContactService).toHaveBeenCalledWith(params.id, body);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should call deleteContactService.execute with correct values', async() => {
      const params = createMock<Params>();
      const deleteContactService = jest.spyOn(sut['deleteContactService'], 'execute').mockResolvedValueOnce(createMock());

      const result = await sut.remove(params);

      expect(deleteContactService).toHaveBeenCalledWith(params.id);
      expect(result).toBeDefined();
    });
  });
});
