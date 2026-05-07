import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CnaeDto } from 'src/app/global/taxation/cnae/application/dtos/cnae.dto';
import { CreateCnae } from 'src/app/global/taxation/cnae/application/usecases/create-cnae/create-cnae.service';
import { CreateCnaeInputDto, CreateCnaeOutputDto } from 'src/app/global/taxation/cnae/application/usecases/create-cnae/dtos/create-cnae.dto';
import { DeleteCnae } from 'src/app/global/taxation/cnae/application/usecases/delete-cnae/delete-cnae.service';
import { EditCnaeInputDto } from 'src/app/global/taxation/cnae/application/usecases/edit-cnae/dtos/edit-cnae.dto';
import { EditCnae } from 'src/app/global/taxation/cnae/application/usecases/edit-cnae/edit-cnae.service';
import { FindAllCnaeQueryDto } from 'src/app/global/taxation/cnae/application/usecases/find-all-cnae/dtos/find-all-cnae.dto';
import { FindAllCnae } from 'src/app/global/taxation/cnae/application/usecases/find-all-cnae/find-all-cnae.service';
import { FindCnaeById } from 'src/app/global/taxation/cnae/application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { UpdateCnaeStatus } from 'src/app/global/taxation/cnae/application/usecases/update-cnae-status/update-cnae-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CnaeAdminController } from './cnae-admin.controller';

describe('CnaeAdminController - Unit tests', () => {
  let sut: CnaeAdminController;
  let createCnaeService: CreateCnae;
  let findAllCnaeService: FindAllCnae;
  let findCnaeByIdService: FindCnaeById;
  let editCnaeService: EditCnae;
  let updateCnaeStatusService: UpdateCnaeStatus;
  let deleteCnaeService: DeleteCnae;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CnaeAdminController],
      providers: [
        { provide: CreateCnae, useValue: createMock<CreateCnae>() },
        { provide: FindAllCnae, useValue: createMock<FindAllCnae>() },
        { provide: FindCnaeById, useValue: createMock<FindCnaeById>() },
        { provide: EditCnae, useValue: createMock<EditCnae>() },
        { provide: UpdateCnaeStatus, useValue: createMock<UpdateCnaeStatus>() },
        { provide: DeleteCnae, useValue: createMock<DeleteCnae>() },
      ],
    }).compile();

    sut = module.get(CnaeAdminController);
    createCnaeService = module.get(CreateCnae);
    findAllCnaeService = module.get(FindAllCnae);
    findCnaeByIdService = module.get(FindCnaeById);
    editCnaeService = module.get(EditCnae);
    updateCnaeStatusService = module.get(UpdateCnaeStatus);
    deleteCnaeService = module.get(DeleteCnae);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createCnae.execute with body', async() => {
      // Arrange
      const body = createMock<CreateCnaeInputDto>();
      const output = createMock<CreateCnaeOutputDto>();
      const createSpy = jest.spyOn(createCnaeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllCnae.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllCnaeQueryDto>();
      const output = createMock<IPagination<CnaeDto>>();
      const findAllSpy = jest.spyOn(findAllCnaeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findCnaeById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<CnaeDto>();
      const findOneSpy = jest.spyOn(findCnaeByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateCnaeStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateCnaeStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editCnae.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditCnaeInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editCnaeService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteCnae.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteCnaeService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
