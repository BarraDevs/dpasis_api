import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientContactDto } from 'src/app/client/client-contact/application/dtos/client-contact.dto';
import { CreateClientContact } from 'src/app/client/client-contact/application/usecases/create-client-contact/create-client-contact.service';
import {
  CreateClientContactInputDto,
  CreateClientContactOutputDto,
} from 'src/app/client/client-contact/application/usecases/create-client-contact/dtos/create-client-contact.dto';
import { DeleteClientContact } from 'src/app/client/client-contact/application/usecases/delete-client-contact/delete-client-contact.service';
import { EditClientContactInputDto } from 'src/app/client/client-contact/application/usecases/edit-client-contact/dtos/edit-client-contact.dto';
import { EditClientContact } from 'src/app/client/client-contact/application/usecases/edit-client-contact/edit-client-contact.service';
import { FindAllClientContactQueryDto } from 'src/app/client/client-contact/application/usecases/find-all-client-contact/dtos/find-all-client-contact.dto';
import { FindAllClientContact } from 'src/app/client/client-contact/application/usecases/find-all-client-contact/find-all-client-contact.service';
import { FindClientContactById } from 'src/app/client/client-contact/application/usecases/find-client-contact-by-id/find-client-contact-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientContactAdminController } from './client-contact-admin.controller';

describe('ClientContactAdminController - Unit tests', () => {
  let sut: ClientContactAdminController;
  let createClientContactService: CreateClientContact;
  let findAllClientContactService: FindAllClientContact;
  let findClientContactByIdService: FindClientContactById;
  let editClientContactService: EditClientContact;
  let deleteClientContactService: DeleteClientContact;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientContactAdminController],
      providers: [
        { provide: CreateClientContact, useValue: createMock<CreateClientContact>() },
        { provide: FindAllClientContact, useValue: createMock<FindAllClientContact>() },
        { provide: FindClientContactById, useValue: createMock<FindClientContactById>() },
        { provide: EditClientContact, useValue: createMock<EditClientContact>() },
        { provide: DeleteClientContact, useValue: createMock<DeleteClientContact>() },
      ],
    }).compile();

    sut = module.get(ClientContactAdminController);
    createClientContactService = module.get(CreateClientContact);
    findAllClientContactService = module.get(FindAllClientContact);
    findClientContactByIdService = module.get(FindClientContactById);
    editClientContactService = module.get(EditClientContact);
    deleteClientContactService = module.get(DeleteClientContact);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientContact.execute with body', async() => {
      const body = createMock<CreateClientContactInputDto>();
      const output = createMock<CreateClientContactOutputDto>();
      const createSpy = jest.spyOn(createClientContactService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientContact.execute with queries', async() => {
      const queries = createMock<FindAllClientContactQueryDto>();
      const output = createMock<IPagination<ClientContactDto>>();
      const findAllSpy = jest.spyOn(findAllClientContactService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientContactById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientContactDto>();
      const findOneSpy = jest.spyOn(findClientContactByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientContact.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientContactInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientContactService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteClientContact.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientContactService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
