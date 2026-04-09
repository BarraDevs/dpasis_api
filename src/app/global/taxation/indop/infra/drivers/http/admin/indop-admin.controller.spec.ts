import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { IndopDto } from 'src/app/global/taxation/indop/application/dtos/indop.dto';
import { CreateIndop } from 'src/app/global/taxation/indop/application/usecases/create-indop/create-indop.service';
import { CreateIndopInputDto, CreateIndopOutputDto } from 'src/app/global/taxation/indop/application/usecases/create-indop/dtos/create-indop.dto';
import { DeleteIndop } from 'src/app/global/taxation/indop/application/usecases/delete-indop/delete-indop.service';
import { EditIndopInputDto } from 'src/app/global/taxation/indop/application/usecases/edit-indop/dtos/edit-indop.dto';
import { EditIndop } from 'src/app/global/taxation/indop/application/usecases/edit-indop/edit-indop.service';
import { FindAllIndopQueryDto } from 'src/app/global/taxation/indop/application/usecases/find-all-indop/dtos/find-all-indop.dto';
import { FindAllIndop } from 'src/app/global/taxation/indop/application/usecases/find-all-indop/find-all-indop.service';
import { FindIndopById } from 'src/app/global/taxation/indop/application/usecases/find-indop-by-id/find-indop-by-id.service';
import { UpdateIndopStatus } from 'src/app/global/taxation/indop/application/usecases/update-indop-status/update-indop-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { IndopAdminController } from './indop-admin.controller';

describe('IndopAdminController - Unit tests', () => {
  let sut: IndopAdminController;
  let createIndopService: CreateIndop;
  let findAllIndopService: FindAllIndop;
  let findIndopByIdService: FindIndopById;
  let editIndopService: EditIndop;
  let updateIndopStatusService: UpdateIndopStatus;
  let deleteIndopService: DeleteIndop;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [IndopAdminController],
      providers: [
        { provide: CreateIndop, useValue: createMock<CreateIndop>() },
        { provide: FindAllIndop, useValue: createMock<FindAllIndop>() },
        { provide: FindIndopById, useValue: createMock<FindIndopById>() },
        { provide: EditIndop, useValue: createMock<EditIndop>() },
        { provide: UpdateIndopStatus, useValue: createMock<UpdateIndopStatus>() },
        { provide: DeleteIndop, useValue: createMock<DeleteIndop>() },
      ],
    }).compile();

    sut = module.get(IndopAdminController);
    createIndopService = module.get(CreateIndop);
    findAllIndopService = module.get(FindAllIndop);
    findIndopByIdService = module.get(FindIndopById);
    editIndopService = module.get(EditIndop);
    updateIndopStatusService = module.get(UpdateIndopStatus);
    deleteIndopService = module.get(DeleteIndop);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createIndop.execute with body', async() => {
      // Arrange
      const body = createMock<CreateIndopInputDto>();
      const output = createMock<CreateIndopOutputDto>();
      const createSpy = jest.spyOn(createIndopService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllIndop.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllIndopQueryDto>();
      const output = createMock<IPagination<IndopDto>>();
      const findAllSpy = jest.spyOn(findAllIndopService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findIndopById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<IndopDto>();
      const findOneSpy = jest.spyOn(findIndopByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateIndopStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateIndopStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editIndop.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditIndopInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editIndopService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteIndop.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteIndopService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
