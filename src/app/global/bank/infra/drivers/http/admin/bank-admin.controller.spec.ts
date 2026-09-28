import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { CreateBank } from 'src/app/global/bank/application/usecases/create-bank/create-bank.service';
import { CreateBankInputDto, CreateBankOutputDto } from 'src/app/global/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { DeleteBank } from 'src/app/global/bank/application/usecases/delete-bank/delete-bank.service';
import { EditBankInputDto } from 'src/app/global/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { EditBank } from 'src/app/global/bank/application/usecases/edit-bank/edit-bank.service';
import { FindAllBankQueryDto } from 'src/app/global/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { FindAllBank } from 'src/app/global/bank/application/usecases/find-all-bank/find-all-bank.service';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { RotateBankWebhookTokenOutputDto } from 'src/app/global/bank/application/usecases/rotate-bank-webhook-token/dtos/rotate-bank-webhook-token.dto';
import { RotateBankWebhookToken } from 'src/app/global/bank/application/usecases/rotate-bank-webhook-token/rotate-bank-webhook-token.service';
import { UpdateBankStatus } from 'src/app/global/bank/application/usecases/update-bank-status/update-bank-status.service';
import type { UploadBankCertificateFiles } from 'src/app/global/bank/application/usecases/upload-bank-certificate/dtos/upload-bank-certificate.dto';
import { UploadBankCertificateInputDto } from 'src/app/global/bank/application/usecases/upload-bank-certificate/dtos/upload-bank-certificate.dto';
import { UploadBankCertificate } from 'src/app/global/bank/application/usecases/upload-bank-certificate/upload-bank-certificate.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { BankAdminController } from './bank-admin.controller';

describe('BankAdminController - Unit tests', () => {
  let sut: BankAdminController;
  let createBankService: CreateBank;
  let findAllBankService: FindAllBank;
  let findBankByIdService: FindBankById;
  let editBankService: EditBank;
  let updateBankStatusService: UpdateBankStatus;
  let deleteBankService: DeleteBank;
  let uploadBankCertificate: UploadBankCertificate;
  let rotateBankWebhookToken: RotateBankWebhookToken;

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
        { provide: DeleteBank, useValue: createMock<DeleteBank>() },
        { provide: UploadBankCertificate, useValue: createMock<UploadBankCertificate>() },
        { provide: RotateBankWebhookToken, useValue: createMock<RotateBankWebhookToken>() },
      ],
    }).compile();

    sut = module.get(BankAdminController);
    createBankService = module.get(CreateBank);
    findAllBankService = module.get(FindAllBank);
    findBankByIdService = module.get(FindBankById);
    editBankService = module.get(EditBank);
    updateBankStatusService = module.get(UpdateBankStatus);
    deleteBankService = module.get(DeleteBank);
    uploadBankCertificate = module.get(UploadBankCertificate);
    rotateBankWebhookToken = module.get(RotateBankWebhookToken);
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

  describe('remove', () => {
    it('should call deleteBank.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteBankService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('uploadCertificate', () => {
    it('should call uploadBankCertificate.execute with params, files and body', async() => {
      const params = createMock<Params>();
      const body = createMock<UploadBankCertificateInputDto>();
      const files = createMock<UploadBankCertificateFiles>();
      const output = createMock<SuccessMessage>();
      const spy = jest.spyOn(uploadBankCertificate, 'execute').mockResolvedValue(output);

      const result = await sut.uploadCertificate(params, body, files);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id, files, body);
    });
  });

  describe('rotateWebhookToken', () => {
    it('should call rotateBankWebhookToken.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<RotateBankWebhookTokenOutputDto>();
      const spy = jest.spyOn(rotateBankWebhookToken, 'execute').mockResolvedValue(output);

      const result = await sut.rotateWebhookToken(params);

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith(params.id);
    });
  });
});
