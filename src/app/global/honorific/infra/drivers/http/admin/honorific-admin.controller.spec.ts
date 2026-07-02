import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { HonorificDto } from 'src/app/global/honorific/application/dtos/honorific.dto';
import { CreateHonorific } from 'src/app/global/honorific/application/usecases/create-honorific/create-honorific.service';
import { CreateHonorificInputDto, CreateHonorificOutputDto } from 'src/app/global/honorific/application/usecases/create-honorific/dtos/create-honorific.dto';
import { DeleteHonorific } from 'src/app/global/honorific/application/usecases/delete-honorific/delete-honorific.service';
import { EditHonorificInputDto } from 'src/app/global/honorific/application/usecases/edit-honorific/dtos/edit-honorific.dto';
import { EditHonorific } from 'src/app/global/honorific/application/usecases/edit-honorific/edit-honorific.service';
import { FindAllHonorificQueryDto } from 'src/app/global/honorific/application/usecases/find-all-honorific/dtos/find-all-honorific.dto';
import { FindAllHonorific } from 'src/app/global/honorific/application/usecases/find-all-honorific/find-all-honorific.service';
import { FindHonorificById } from 'src/app/global/honorific/application/usecases/find-honorific-by-id/find-honorific-by-id.service';
import { UpdateHonorificStatus } from 'src/app/global/honorific/application/usecases/update-honorific-status/update-honorific-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { HonorificAdminController } from './honorific-admin.controller';

describe('HonorificAdminController - Unit tests', () => {
  let sut: HonorificAdminController;
  let createHonorific: CreateHonorific;
  let findAllHonorific: FindAllHonorific;
  let findHonorificById: FindHonorificById;
  let editHonorific: EditHonorific;
  let deleteHonorific: DeleteHonorific;
  let updateHonorificStatus: UpdateHonorificStatus;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [HonorificAdminController],
      providers: [
        { provide: CreateHonorific, useValue: createMock<CreateHonorific>() },
        { provide: FindAllHonorific, useValue: createMock<FindAllHonorific>() },
        { provide: FindHonorificById, useValue: createMock<FindHonorificById>() },
        { provide: EditHonorific, useValue: createMock<EditHonorific>() },
        { provide: DeleteHonorific, useValue: createMock<DeleteHonorific>() },
        { provide: UpdateHonorificStatus, useValue: createMock<UpdateHonorificStatus>() },
      ],
    }).compile();

    sut = module.get(HonorificAdminController);
    createHonorific = module.get(CreateHonorific);
    findAllHonorific = module.get(FindAllHonorific);
    findHonorificById = module.get(FindHonorificById);
    editHonorific = module.get(EditHonorific);
    deleteHonorific = module.get(DeleteHonorific);
    updateHonorificStatus = module.get(UpdateHonorificStatus);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createHonorific.execute with body', async() => {
      const body = createMock<CreateHonorificInputDto>();
      const output = createMock<CreateHonorificOutputDto>();
      const spy = jest.spyOn(createHonorific, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllHonorific.execute with queries', async() => {
      const queries = createMock<FindAllHonorificQueryDto>();
      const output = createMock<IPagination<HonorificDto>>();
      const spy = jest.spyOn(findAllHonorific, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findHonorificById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<HonorificDto>();
      const spy = jest.spyOn(findHonorificById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editHonorific.execute', async() => {
      const params = createMock<Params>();
      const body = createMock<EditHonorificInputDto>();
      const output = createMock<SuccessMessage>();
      const spy = jest.spyOn(editHonorific, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteHonorific.execute', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const spy = jest.spyOn(deleteHonorific, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateHonorificStatus.execute', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const spy = jest.spyOn(updateHonorificStatus, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id);
    });
  });
});
