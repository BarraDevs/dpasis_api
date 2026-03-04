import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankDto } from 'src/app/bank/application/dtos/bank.dto';
import { CreateBank } from 'src/app/bank/application/usecases/create-bank/create-bank.service';
import { CreateBankInputDto, CreateBankOutputDto } from 'src/app/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { EditBankInputDto } from 'src/app/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { EditBank } from 'src/app/bank/application/usecases/edit-bank/edit-bank.service';
import { FindAllBankQueryDto } from 'src/app/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { FindAllBank } from 'src/app/bank/application/usecases/find-all-bank/find-all-bank.service';
import { FindBankById } from 'src/app/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { UpdateBankStatus } from 'src/app/bank/application/usecases/update-bank-status/update-bank-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BankAdminController } from './bank-admin.controller';

describe('BankAdminController - Unit tests', () => {
  let sut: BankAdminController;
  let createBankService: CreateBank;
  let findAllBankService: FindAllBank;
  let findBankByIdService: FindBankById;
  let editBankService: EditBank;
  let updateBankStatusService: UpdateBankStatus;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [BankAdminController],
      providers: [
        { provide: CreateBank, useValue: createMock<CreateBank>() },
        { provide: FindAllBank, useValue: createMock<FindAllBank>() },
        { provide: FindBankById, useValue: createMock<FindBankById>() },
        { provide: EditBank, useValue: createMock<EditBank>() },
        { provide: UpdateBankStatus, useValue: createMock<UpdateBankStatus>() },
      ],
    }).compile();

    sut = module.get(BankAdminController);
    createBankService = module.get(CreateBank);
    findAllBankService = module.get(FindAllBank);
    findBankByIdService = module.get(FindBankById);
    editBankService = module.get(EditBank);
    updateBankStatusService = module.get(UpdateBankStatus);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createBank.execute with body', async() => {
      // Arrange
      const body = createMock<CreateBankInputDto>();
      const output = createMock<CreateBankOutputDto>();
      const createSpy = jest.spyOn(createBankService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(body);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllBank.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllBankQueryDto>();
      const output = createMock<IPagination<BankDto>>();
      const findAllSpy = jest.spyOn(findAllBankService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findBankById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<BankDto>();
      const findOneSpy = jest.spyOn(findBankByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateBankStatus.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateBankStatusService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.updateStatus(params);

      // Assert
      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editBank.execute with params.id and body', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = createMock<EditBankInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editBankService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });
});
