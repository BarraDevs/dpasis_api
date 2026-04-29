import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ResaleContactDto } from 'src/app/resale/resale-contact/application/dtos/resale-contact.dto';
import { ActivateResaleContact } from 'src/app/resale/resale-contact/application/usecases/activate-resale-contact/activate-resale-contact.service';
import { CreateResaleContact } from 'src/app/resale/resale-contact/application/usecases/create-resale-contact/create-resale-contact.service';
import {
  CreateResaleContactInputDto,
  CreateResaleContactOutputDto,
} from 'src/app/resale/resale-contact/application/usecases/create-resale-contact/dtos/create-resale-contact.dto';
import { DeactivateResaleContact } from 'src/app/resale/resale-contact/application/usecases/deactivate-resale-contact/deactivate-resale-contact.service';
import { DeleteResaleContact } from 'src/app/resale/resale-contact/application/usecases/delete-resale-contact/delete-resale-contact.service';
import { EditResaleContactInputDto } from 'src/app/resale/resale-contact/application/usecases/edit-resale-contact/dtos/edit-resale-contact.dto';
import { EditResaleContact } from 'src/app/resale/resale-contact/application/usecases/edit-resale-contact/edit-resale-contact.service';
import { FindAllResaleContactQueryDto } from 'src/app/resale/resale-contact/application/usecases/find-all-resale-contact/dtos/find-all-resale-contact.dto';
import { FindAllResaleContact } from 'src/app/resale/resale-contact/application/usecases/find-all-resale-contact/find-all-resale-contact.service';
import { FindResaleContactById } from 'src/app/resale/resale-contact/application/usecases/find-resale-contact-by-id/find-resale-contact-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ResaleContactAdminController } from './resale-contact-admin.controller';

describe('ResaleContactAdminController - Unit tests', () => {
  let sut: ResaleContactAdminController;
  let createResaleContactService: CreateResaleContact;
  let findAllResaleContactService: FindAllResaleContact;
  let findResaleContactByIdService: FindResaleContactById;
  let editResaleContactService: EditResaleContact;
  let activateResaleContactService: ActivateResaleContact;
  let deactivateResaleContactService: DeactivateResaleContact;
  let deleteResaleContactService: DeleteResaleContact;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ResaleContactAdminController],
      providers: [
        { provide: CreateResaleContact, useValue: createMock<CreateResaleContact>() },
        { provide: FindAllResaleContact, useValue: createMock<FindAllResaleContact>() },
        { provide: FindResaleContactById, useValue: createMock<FindResaleContactById>() },
        { provide: EditResaleContact, useValue: createMock<EditResaleContact>() },
        { provide: ActivateResaleContact, useValue: createMock<ActivateResaleContact>() },
        { provide: DeactivateResaleContact, useValue: createMock<DeactivateResaleContact>() },
        { provide: DeleteResaleContact, useValue: createMock<DeleteResaleContact>() },
      ],
    }).compile();

    sut = module.get(ResaleContactAdminController);
    createResaleContactService = module.get(CreateResaleContact);
    findAllResaleContactService = module.get(FindAllResaleContact);
    findResaleContactByIdService = module.get(FindResaleContactById);
    editResaleContactService = module.get(EditResaleContact);
    activateResaleContactService = module.get(ActivateResaleContact);
    deactivateResaleContactService = module.get(DeactivateResaleContact);
    deleteResaleContactService = module.get(DeleteResaleContact);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createResaleContact.execute with body', async() => {
      const body = createMock<CreateResaleContactInputDto>();
      const output = createMock<CreateResaleContactOutputDto>();
      const createSpy = jest.spyOn(createResaleContactService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllResaleContact.execute with queries', async() => {
      const queries = createMock<FindAllResaleContactQueryDto>();
      const output = createMock<IPagination<ResaleContactDto>>();
      const findAllSpy = jest.spyOn(findAllResaleContactService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findResaleContactById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ResaleContactDto>();
      const findOneSpy = jest.spyOn(findResaleContactByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateResaleContact.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateResaleContactService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateResaleContact.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateResaleContactService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editResaleContact.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditResaleContactInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editResaleContactService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteResaleContact.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteResaleContactService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
