import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AttachmentDto } from 'src/app/attachment/application/dtos/attachment.dto';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from 'src/app/attachment/application/usecases/create-attachment/dtos/create-attachment.dto';
import { EditAttachmentInputDto } from 'src/app/attachment/application/usecases/edit-attachment/dtos/edit-attachment.dto';
import { FindAllAttachmentQueryDto } from 'src/app/attachment/application/usecases/find-all-attachment/dtos/find-all-attachment.dto';
import { AttachmentModule } from 'src/app/attachment/attachment.module';
import { AuthorizationGuard } from 'src/app/authentication/application/guards/authorization/authorization.guard';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AttachmentController } from './attachment.controller';

describe('AttachmentController', () => {
  let sut: AttachmentController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AttachmentModule], // Import AttachmentModule
    })
    // Mock the guard to always allow access for controller tests
      .overrideGuard(AuthorizationGuard) // Assuming RequiredRoles() is used
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    sut = module.get(AttachmentController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createAttachmentService.execute with correct values', async() => {
      // Arrange
      const input = createMock<CreateAttachmentInputDto>();
      const output = createMock<CreateAttachmentOutputDto>();
      const createAttachmentServiceSpy = jest.spyOn(sut['createAttachmentService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createAttachmentServiceSpy).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllAttachmentService.execute with correct values', async() => {
      // Arrange
      const queries = createMock<FindAllAttachmentQueryDto>();
      const output = createMock<IPagination<AttachmentDto>>();
      const findAllAttachmentServiceSpy = jest.spyOn(sut['findAllAttachmentService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllAttachmentServiceSpy).toHaveBeenCalledWith(queries);
      expect(result).toBe(output);
    });
  });

  describe('findOne', () => {
    it('should call findAttachmentByIdService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-attach-id' });
      const output = createMock<AttachmentDto>();
      const findAttachmentByIdServiceSpy = jest.spyOn(sut['findAttachmentByIdService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findAttachmentByIdServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });

  describe('update', () => {
    it('should call editAttachmentService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-attach-id' });
      const body = createMock<EditAttachmentInputDto>();
      const output = createMock<SuccessMessage>();
      const editAttachmentServiceSpy = jest.spyOn(sut['editAttachmentService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editAttachmentServiceSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toBe(output);
    });
  });

  describe('remove', () => {
    it('should call deleteAttachmentService.execute with correct values', async() => {
      // Arrange
      const params = createMock<Params>({ id: 'some-attach-id' });
      const output = createMock<SuccessMessage>();
      const deleteAttachmentServiceSpy = jest.spyOn(sut['deleteAttachmentService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(deleteAttachmentServiceSpy).toHaveBeenCalledWith(params.id);
      expect(result).toBe(output);
    });
  });
});
