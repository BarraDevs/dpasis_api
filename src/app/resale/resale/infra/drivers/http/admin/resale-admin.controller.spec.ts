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
import { ParamsHexId } from 'src/infra/validators/class/dtos/params';
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
    it('should map hex optional id and wire response id', async() => {
      const body = createMock<CreateResaleInputDto>();
      body.id = '43';
      const innerOutput: CreateResaleOutputDto = { id: 67 };
      const createSpy = jest.spyOn(createResale, 'execute').mockResolvedValue(innerOutput);

      const result = await sut.create(body);

      expect(result).toEqual({ id: '43' });
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 67 }), undefined);
    });
  });

  describe('findAll', () => {
    it('should map resale ids in pagination data to hex', async() => {
      const queries = createMock<FindAllResaleQueryDto>();
      const dto = createMock<ResaleDto>();
      dto.id = 67;
      const output: IPagination<ResaleDto> = {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 1,
        totalPages: 1,
        data: [dto],
      };
      const findAllSpy = jest.spyOn(findAllResale, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(findAllSpy).toHaveBeenCalledWith(queries);
      expect(result.data[0].id).toBe('43');
    });
  });

  describe('getSequence', () => {
    it('should map nextId to hexadecimal string', async() => {
      const output: GetResaleSequenceOutputDto = { nextId: 67 };
      const getSequenceSpy = jest.spyOn(getResaleSequence, 'execute').mockResolvedValue(output);

      const result = await sut.getSequence();

      expect(result).toEqual({ nextId: '43' });
      expect(getSequenceSpy).toHaveBeenCalledWith();
    });
  });

  describe('setSequence', () => {
    it('should parse nextId from hex before execute', async() => {
      const body = { nextId: '43' } as SetResaleNextIdInputDto;
      const output = createMock<SuccessMessage>();
      const setSequenceSpy = jest.spyOn(setResaleNextId, 'execute').mockResolvedValue(output);

      const result = await sut.setSequence(body);

      expect(result).toEqual(output);
      expect(setSequenceSpy).toHaveBeenCalledWith({ nextId: 67 });
    });
  });

  describe('findOne', () => {
    it('should parse path id and map response', async() => {
      const params = { id: '43' } as ParamsHexId;
      const inner = createMock<ResaleDto>();
      inner.id = 67;
      const findOneSpy = jest.spyOn(findResaleById, 'execute').mockResolvedValue(inner);

      const result = await sut.findOne(params);

      expect(findOneSpy).toHaveBeenCalledWith(67);
      expect(result.id).toBe('43');
    });
  });

  describe('activate', () => {
    it('should call activateResale.execute with decimal id', async() => {
      const params = { id: '43' } as ParamsHexId;
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateResale, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(67);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateResale.execute with decimal id', async() => {
      const params = { id: '43' } as ParamsHexId;
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateResale, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(67);
    });
  });

  describe('update', () => {
    it('should call editResale.execute with decimal id', async() => {
      const params = { id: '43' } as ParamsHexId;
      const body = createMock<EditResaleInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editResale, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(67, body, undefined);
    });
  });
});
