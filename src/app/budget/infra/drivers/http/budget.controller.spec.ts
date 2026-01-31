import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { BudgetDto } from 'src/app/budget/application/dtos/budget.dto';
import { CreateBudgetInputDto, CreateBudgetOutputDto } from 'src/app/budget/application/usecases/create-budget/dtos/create-budget.dto';
import { EditBudgetInputDto } from 'src/app/budget/application/usecases/edit-budget/dtos/edit-budget.dto';
import { FindAllBudgetQueryDto } from 'src/app/budget/application/usecases/find-all-budget/dtos/find-all-budget.dto';
import { RejectBudgetInputDto } from 'src/app/budget/application/usecases/reject-budget/dtos/reject-budget.dto';
import { BudgetModule } from 'src/app/budget/budget.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BudgetController } from './budget.controller';

describe('BudgetController', () => {
  let sut: BudgetController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        BudgetModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(BudgetController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createBudgetService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateBudgetInputDto>();
      const output = createMock<CreateBudgetOutputDto>();
      const createBudgetSpy = jest.spyOn(sut['createBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createBudgetSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllBudgetService with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllBudgetQueryDto>();
      const output = createMock<IPagination<BudgetDto>>();
      const findAllBudgetSpy = jest.spyOn(sut['findAllBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllBudgetSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findOne', () => {
    it('should call findBudgetByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<BudgetDto>();
      const findBudgetByIdSpy = jest.spyOn(sut['findBudgetByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findBudgetByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('update', () => {
    it('should call editBudgetService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditBudgetInputDto>();
      const output = createMock<SuccessMessage>();
      const editBudgetSpy = jest.spyOn(sut['editBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editBudgetSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });
  });

  describe('remove', () => {
    it('should call deleteBudgetService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deleteBudgetSpy = jest.spyOn(sut['deleteBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(deleteBudgetSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('approve', () => {
    it('should call approveBudgetService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const user = createMock<Payload>();
      const output = createMock<SuccessMessage>();
      const approveBudgetSpy = jest.spyOn(sut['approveBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.approve(params, user);

      // Assert
      expect(approveBudgetSpy).toHaveBeenCalledWith(params.id, user.sub);
      expect(result).toEqual(output);
    });
  });

  describe('reject', () => {
    it('should call rejectBudgetService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<RejectBudgetInputDto>({ reason: 'Preço muito alto' });
      const user = createMock<Payload>();
      const output = createMock<SuccessMessage>();
      const rejectBudgetSpy = jest.spyOn(sut['rejectBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.reject(params, body, user);

      // Assert
      expect(rejectBudgetSpy).toHaveBeenCalledWith(params.id, { accountId: user.sub, reason: body.reason });
      expect(result).toEqual(output);
    });
  });

  describe('cancel', () => {
    it('should call cancelBudgetService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const cancelBudgetSpy = jest.spyOn(sut['cancelBudgetService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.cancel(params);

      // Assert
      expect(cancelBudgetSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });
});
