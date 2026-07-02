import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { FaqDto } from 'src/app/global/faq/application/dtos/faq.dto';
import { CreateFaq } from 'src/app/global/faq/application/usecases/create-faq/create-faq.service';
import { CreateFaqInputDto, CreateFaqOutputDto } from 'src/app/global/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { DeleteFaq } from 'src/app/global/faq/application/usecases/delete-faq/delete-faq.service';
import { EditFaqInputDto } from 'src/app/global/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { EditFaq } from 'src/app/global/faq/application/usecases/edit-faq/edit-faq.service';
import { FindAllFaqQueryDto } from 'src/app/global/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { FindAllFaq } from 'src/app/global/faq/application/usecases/find-all-faq/find-all-faq.service';
import { FindFaqById } from 'src/app/global/faq/application/usecases/find-faq-by-id/find-faq-by-id.service';
import { UpdateFaqStatus } from 'src/app/global/faq/application/usecases/update-faq-status/update-faq-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FaqAdminController } from './faq-admin.controller';

describe('FaqAdminController - Unit tests', () => {
  let sut: FaqAdminController;
  let createFaq: CreateFaq;
  let findAllFaq: FindAllFaq;
  let findFaqById: FindFaqById;
  let editFaq: EditFaq;
  let deleteFaq: DeleteFaq;
  let updateFaqStatus: UpdateFaqStatus;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [FaqAdminController],
      providers: [
        { provide: CreateFaq, useValue: createMock<CreateFaq>() },
        { provide: FindAllFaq, useValue: createMock<FindAllFaq>() },
        { provide: FindFaqById, useValue: createMock<FindFaqById>() },
        { provide: EditFaq, useValue: createMock<EditFaq>() },
        { provide: DeleteFaq, useValue: createMock<DeleteFaq>() },
        { provide: UpdateFaqStatus, useValue: createMock<UpdateFaqStatus>() },
      ],
    }).compile();

    sut = module.get(FaqAdminController);
    createFaq = module.get(CreateFaq);
    findAllFaq = module.get(FindAllFaq);
    findFaqById = module.get(FindFaqById);
    editFaq = module.get(EditFaq);
    deleteFaq = module.get(DeleteFaq);
    updateFaqStatus = module.get(UpdateFaqStatus);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createFaq.execute with body', async() => {
      // Arrange
      const body = createMock<CreateFaqInputDto>();
      const output = createMock<CreateFaqOutputDto>();
      const createSpy = jest.spyOn(createFaq, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllFaq.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllFaqQueryDto>();
      const output = createMock<IPagination<FaqDto>>();
      const findAllSpy = jest.spyOn(findAllFaq, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findFaqById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<FaqDto>();
      const findOneSpy = jest.spyOn(findFaqById, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editFaq.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditFaqInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editFaq, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteFaq.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteFaq, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateFaqStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateFaqStatus, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
