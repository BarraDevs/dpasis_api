import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import { ActivateResale } from 'src/app/resale/resale/application/usecases/activate-resale/activate-resale.service';
import { CreateResale } from 'src/app/resale/resale/application/usecases/create-resale/create-resale.service';
import {
  CreateResaleInputDto,
  CreateResaleOutputDto,
} from 'src/app/resale/resale/application/usecases/create-resale/dtos/create-resale.dto';
import { DeactivateResale } from 'src/app/resale/resale/application/usecases/deactivate-resale/deactivate-resale.service';
import { EditResaleInputDto } from 'src/app/resale/resale/application/usecases/edit-resale/dtos/edit-resale.dto';
import { EditResale } from 'src/app/resale/resale/application/usecases/edit-resale/edit-resale.service';
import { FindAllResaleQueryDto } from 'src/app/resale/resale/application/usecases/find-all-resale/dtos/find-all-resale.dto';
import { FindAllResale } from 'src/app/resale/resale/application/usecases/find-all-resale/find-all-resale.service';
import { FindResaleById } from 'src/app/resale/resale/application/usecases/find-resale-by-id/find-resale-by-id.service';
import { GetResaleSequenceOutputDto } from 'src/app/resale/resale/application/usecases/get-resale-sequence/dtos/get-resale-sequence.dto';
import { GetResaleSequence } from 'src/app/resale/resale/application/usecases/get-resale-sequence/get-resale-sequence.service';
import { SetResaleNextIdInputDto } from 'src/app/resale/resale/application/usecases/set-resale-next-id/dtos/set-resale-next-id.dto';
import { SetResaleNextId } from 'src/app/resale/resale/application/usecases/set-resale-next-id/set-resale-next-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ResaleAdminController } from './resale-admin.controller';

describe('ResaleAdminController - Unit tests', () => {
  let sut: ResaleAdminController;
  let activateResale: ActivateResale;
  let createResale: CreateResale;
  let deactivateResale: DeactivateResale;
  let findAllResale: FindAllResale;
  let findResaleById: FindResaleById;
  let editResale: EditResale;
  let getResaleSequence: GetResaleSequence;
  let setResaleNextId: SetResaleNextId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ResaleAdminController],
      providers: [
        { provide: ActivateResale, useValue: createMock<ActivateResale>() },
        { provide: CreateResale, useValue: createMock<CreateResale>() },
        { provide: DeactivateResale, useValue: createMock<DeactivateResale>() },
        { provide: FindAllResale, useValue: createMock<FindAllResale>() },
        { provide: FindResaleById, useValue: createMock<FindResaleById>() },
        { provide: EditResale, useValue: createMock<EditResale>() },
        { provide: GetResaleSequence, useValue: createMock<GetResaleSequence>() },
        { provide: SetResaleNextId, useValue: createMock<SetResaleNextId>() },
      ],
    }).compile();

    sut = module.get(ResaleAdminController);
    activateResale = module.get(ActivateResale);
    createResale = module.get(CreateResale);
    deactivateResale = module.get(DeactivateResale);
    findAllResale = module.get(FindAllResale);
    findResaleById = module.get(FindResaleById);
    editResale = module.get(EditResale);
    getResaleSequence = module.get(GetResaleSequence);
    setResaleNextId = module.get(SetResaleNextId);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createResale.execute with body', async() => {
      const body = createMock<CreateResaleInputDto>();
      const output = createMock<CreateResaleOutputDto>();
      const createSpy = jest.spyOn(createResale, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body, undefined);
    });
  });

  describe('findAll', () => {
    it('should call findAllResale.execute with queries', async() => {
      const queries = createMock<FindAllResaleQueryDto>();
      const output = createMock<IPagination<ResaleDto>>();
      const findAllSpy = jest.spyOn(findAllResale, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('getSequence', () => {
    it('should call getResaleSequence.execute with no arguments', async() => {
      const output = createMock<GetResaleSequenceOutputDto>();
      const getSequenceSpy = jest.spyOn(getResaleSequence, 'execute').mockResolvedValue(output);

      const result = await sut.getSequence();

      expect(result).toEqual(output);
      expect(getSequenceSpy).toHaveBeenCalledWith();
    });
  });

  describe('setSequence', () => {
    it('should call setResaleNextId.execute with body', async() => {
      const body = createMock<SetResaleNextIdInputDto>();
      const output = createMock<SuccessMessage>();
      const setSequenceSpy = jest.spyOn(setResaleNextId, 'execute').mockResolvedValue(output);

      const result = await sut.setSequence(body);

      expect(result).toEqual(output);
      expect(setSequenceSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findOne', () => {
    it('should call findResaleById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ResaleDto>();
      const findOneSpy = jest.spyOn(findResaleById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateResale.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateResale, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateResale.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateResale, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editResale.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditResaleInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editResale, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body, undefined);
    });
  });
});
