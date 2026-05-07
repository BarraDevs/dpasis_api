import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NbsDto } from 'src/app/global/taxation/nbs/application/dtos/nbs.dto';
import { CreateNbs } from 'src/app/global/taxation/nbs/application/usecases/create-nbs/create-nbs.service';
import { CreateNbsInputDto, CreateNbsOutputDto } from 'src/app/global/taxation/nbs/application/usecases/create-nbs/dtos/create-nbs.dto';
import { DeleteNbs } from 'src/app/global/taxation/nbs/application/usecases/delete-nbs/delete-nbs.service';
import { EditNbsInputDto } from 'src/app/global/taxation/nbs/application/usecases/edit-nbs/dtos/edit-nbs.dto';
import { EditNbs } from 'src/app/global/taxation/nbs/application/usecases/edit-nbs/edit-nbs.service';
import { FindAllNbsQueryDto } from 'src/app/global/taxation/nbs/application/usecases/find-all-nbs/dtos/find-all-nbs.dto';
import { FindAllNbs } from 'src/app/global/taxation/nbs/application/usecases/find-all-nbs/find-all-nbs.service';
import { FindNbsById } from 'src/app/global/taxation/nbs/application/usecases/find-nbs-by-id/find-nbs-by-id.service';
import { UpdateNbsStatus } from 'src/app/global/taxation/nbs/application/usecases/update-nbs-status/update-nbs-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { NbsAdminController } from './nbs-admin.controller';

describe('NbsAdminController - Unit tests', () => {
  let sut: NbsAdminController;
  let createNbsService: CreateNbs;
  let findAllNbsService: FindAllNbs;
  let findNbsByIdService: FindNbsById;
  let editNbsService: EditNbs;
  let updateNbsStatusService: UpdateNbsStatus;
  let deleteNbsService: DeleteNbs;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NbsAdminController],
      providers: [
        { provide: CreateNbs, useValue: createMock<CreateNbs>() },
        { provide: FindAllNbs, useValue: createMock<FindAllNbs>() },
        { provide: FindNbsById, useValue: createMock<FindNbsById>() },
        { provide: EditNbs, useValue: createMock<EditNbs>() },
        { provide: UpdateNbsStatus, useValue: createMock<UpdateNbsStatus>() },
        { provide: DeleteNbs, useValue: createMock<DeleteNbs>() },
      ],
    }).compile();

    sut = module.get(NbsAdminController);
    createNbsService = module.get(CreateNbs);
    findAllNbsService = module.get(FindAllNbs);
    findNbsByIdService = module.get(FindNbsById);
    editNbsService = module.get(EditNbs);
    updateNbsStatusService = module.get(UpdateNbsStatus);
    deleteNbsService = module.get(DeleteNbs);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createNbs.execute with body', async() => {
      // Arrange
      const body = createMock<CreateNbsInputDto>();
      const output = createMock<CreateNbsOutputDto>();
      const createSpy = jest.spyOn(createNbsService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllNbs.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllNbsQueryDto>();
      const output = createMock<IPagination<NbsDto>>();
      const findAllSpy = jest.spyOn(findAllNbsService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findNbsById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<NbsDto>();
      const findOneSpy = jest.spyOn(findNbsByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateNbsStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateNbsStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editNbs.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditNbsInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editNbsService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteNbs.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteNbsService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
