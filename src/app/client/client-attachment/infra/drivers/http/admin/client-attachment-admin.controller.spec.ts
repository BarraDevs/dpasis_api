import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAttachmentDto } from 'src/app/client/client-attachment/application/dtos/client-attachment.dto';
import { CreateClientAttachment } from 'src/app/client/client-attachment/application/usecases/create-client-attachment/create-client-attachment.service';
import {
  CreateClientAttachmentInputDto,
  CreateClientAttachmentOutputDto,
} from 'src/app/client/client-attachment/application/usecases/create-client-attachment/dtos/create-client-attachment.dto';
import { DeleteClientAttachment } from 'src/app/client/client-attachment/application/usecases/delete-client-attachment/delete-client-attachment.service';
import { EditClientAttachmentInputDto } from 'src/app/client/client-attachment/application/usecases/edit-client-attachment/dtos/edit-client-attachment.dto';
import { EditClientAttachment } from 'src/app/client/client-attachment/application/usecases/edit-client-attachment/edit-client-attachment.service';
import { FindAllClientAttachmentQueryDto } from 'src/app/client/client-attachment/application/usecases/find-all-client-attachment/dtos/find-all-client-attachment.dto';
import { FindAllClientAttachment } from 'src/app/client/client-attachment/application/usecases/find-all-client-attachment/find-all-client-attachment.service';
import { FindClientAttachmentById } from 'src/app/client/client-attachment/application/usecases/find-client-attachment-by-id/find-client-attachment-by-id.service';
import { UpdateClientAttachmentStatus } from 'src/app/client/client-attachment/application/usecases/update-client-attachment-status/update-client-attachment-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAttachmentAdminController } from './client-attachment-admin.controller';

function createMulterFileStub(): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'doc.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 10,
    buffer: Buffer.from('x'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };
}

describe('ClientAttachmentAdminController - Unit tests', () => {
  let sut: ClientAttachmentAdminController;
  let createClientAttachment: CreateClientAttachment;
  let findAllClientAttachment: FindAllClientAttachment;
  let findClientAttachmentById: FindClientAttachmentById;
  let editClientAttachment: EditClientAttachment;
  let updateClientAttachmentStatus: UpdateClientAttachmentStatus;
  let deleteClientAttachment: DeleteClientAttachment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ClientAttachmentAdminController],
      providers: [
        { provide: CreateClientAttachment, useValue: createMock<CreateClientAttachment>() },
        { provide: FindAllClientAttachment, useValue: createMock<FindAllClientAttachment>() },
        { provide: FindClientAttachmentById, useValue: createMock<FindClientAttachmentById>() },
        { provide: EditClientAttachment, useValue: createMock<EditClientAttachment>() },
        { provide: UpdateClientAttachmentStatus, useValue: createMock<UpdateClientAttachmentStatus>() },
        { provide: DeleteClientAttachment, useValue: createMock<DeleteClientAttachment>() },
      ],
    }).compile();

    sut = module.get(ClientAttachmentAdminController);
    createClientAttachment = module.get(CreateClientAttachment);
    findAllClientAttachment = module.get(FindAllClientAttachment);
    findClientAttachmentById = module.get(FindClientAttachmentById);
    editClientAttachment = module.get(EditClientAttachment);
    updateClientAttachmentStatus = module.get(UpdateClientAttachmentStatus);
    deleteClientAttachment = module.get(DeleteClientAttachment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientAttachment.execute with file and body', async() => {
      const file = createMulterFileStub();
      const body = createMock<CreateClientAttachmentInputDto>();
      const output = createMock<CreateClientAttachmentOutputDto>();
      const createSpy = jest.spyOn(createClientAttachment, 'execute').mockResolvedValue(output);

      const result = await sut.create(body, file);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body, file);
    });

    it('should call createClientAttachment.execute with body and undefined file when omitted', async() => {
      const body = createMock<CreateClientAttachmentInputDto>();
      const output = createMock<CreateClientAttachmentOutputDto>();
      const createSpy = jest.spyOn(createClientAttachment, 'execute').mockResolvedValue(output);

      const result = await sut.create(body, undefined);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body, undefined);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientAttachment.execute with queries', async() => {
      const queries = createMock<FindAllClientAttachmentQueryDto>();
      const output = createMock<IPagination<ClientAttachmentDto>>();
      const findAllSpy = jest.spyOn(findAllClientAttachment, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findClientAttachmentById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientAttachmentDto>();
      const findOneSpy = jest.spyOn(findClientAttachmentById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateClientAttachmentStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateClientAttachmentStatus, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editClientAttachment.execute with params.id, body and file', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientAttachmentInputDto>();
      const file = createMulterFileStub();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientAttachment, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body, file);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body, file);
    });

    it('should call editClientAttachment.execute with undefined file when omitted', async() => {
      const params = createMock<Params>();
      const body = createMock<EditClientAttachmentInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editClientAttachment, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body, undefined);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body, undefined);
    });
  });

  describe('remove', () => {
    it('should call deleteClientAttachment.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteClientAttachment, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
