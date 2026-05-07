import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { FreightDto } from 'src/app/global/freight/application/dtos/freight.dto';
import { CreateFreight } from 'src/app/global/freight/application/usecases/create-freight/create-freight.service';
import { CreateFreightInputDto, CreateFreightOutputDto } from 'src/app/global/freight/application/usecases/create-freight/dtos/create-freight.dto';
import { DeleteFreight } from 'src/app/global/freight/application/usecases/delete-freight/delete-freight.service';
import { EditFreightInputDto } from 'src/app/global/freight/application/usecases/edit-freight/dtos/edit-freight.dto';
import { EditFreight } from 'src/app/global/freight/application/usecases/edit-freight/edit-freight.service';
import { FindAllFreightQueryDto } from 'src/app/global/freight/application/usecases/find-all-freight/dtos/find-all-freight.dto';
import { FindAllFreight } from 'src/app/global/freight/application/usecases/find-all-freight/find-all-freight.service';
import { FindFreightById } from 'src/app/global/freight/application/usecases/find-freight-by-id/find-freight-by-id.service';
import { UpdateFreightStatus } from 'src/app/global/freight/application/usecases/update-freight-status/update-freight-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FreightAdminController } from './freight-admin.controller';

describe('FreightAdminController - Unit tests', () => {
  let sut: FreightAdminController;
  let createFreightService: CreateFreight;
  let findAllFreightService: FindAllFreight;
  let findFreightByIdService: FindFreightById;
  let editFreightService: EditFreight;
  let updateFreightStatusService: UpdateFreightStatus;
  let deleteFreightService: DeleteFreight;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [FreightAdminController],
      providers: [
        { provide: CreateFreight, useValue: createMock<CreateFreight>() },
        { provide: FindAllFreight, useValue: createMock<FindAllFreight>() },
        { provide: FindFreightById, useValue: createMock<FindFreightById>() },
        { provide: EditFreight, useValue: createMock<EditFreight>() },
        { provide: UpdateFreightStatus, useValue: createMock<UpdateFreightStatus>() },
        { provide: DeleteFreight, useValue: createMock<DeleteFreight>() },
      ],
    }).compile();

    sut = module.get(FreightAdminController);
    createFreightService = module.get(CreateFreight);
    findAllFreightService = module.get(FindAllFreight);
    findFreightByIdService = module.get(FindFreightById);
    editFreightService = module.get(EditFreight);
    updateFreightStatusService = module.get(UpdateFreightStatus);
    deleteFreightService = module.get(DeleteFreight);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createFreight.execute with body', async() => {
      const body = createMock<CreateFreightInputDto>();
      const output = createMock<CreateFreightOutputDto>();
      const createSpy = jest.spyOn(createFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllFreight.execute with queries', async() => {
      const queries = createMock<FindAllFreightQueryDto>();
      const output = createMock<IPagination<FreightDto>>();
      const findAllSpy = jest.spyOn(findAllFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findFreightById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<FreightDto>();
      const findOneSpy = jest.spyOn(findFreightByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateFreightStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateFreightStatusService, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editFreight.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditFreightInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteFreight.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteFreightService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
