import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { EmailTemplateVariableDto } from 'src/app/global/email-template-variable/application/dtos/email-template-variable.dto';
import { CreateEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/create-email-template-variable/create-email-template-variable.service';
import { CreateEmailTemplateVariableInputDto, CreateEmailTemplateVariableOutputDto } from 'src/app/global/email-template-variable/application/usecases/create-email-template-variable/dtos/create-email-template-variable.dto';
import { DeleteEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/delete-email-template-variable/delete-email-template-variable.service';
import { EditEmailTemplateVariableInputDto } from 'src/app/global/email-template-variable/application/usecases/edit-email-template-variable/dtos/edit-email-template-variable.dto';
import { EditEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/edit-email-template-variable/edit-email-template-variable.service';
import { FindAllEmailTemplateVariableQueryDto } from 'src/app/global/email-template-variable/application/usecases/find-all-email-template-variable/dtos/find-all-email-template-variable.dto';
import { FindAllEmailTemplateVariable } from 'src/app/global/email-template-variable/application/usecases/find-all-email-template-variable/find-all-email-template-variable.service';
import { FindEmailTemplateVariableById } from 'src/app/global/email-template-variable/application/usecases/find-email-template-variable-by-id/find-email-template-variable-by-id.service';
import { UpdateEmailTemplateVariableStatus } from 'src/app/global/email-template-variable/application/usecases/update-email-template-variable-status/update-email-template-variable-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { EmailTemplateVariableAdminController } from './email-template-variable-admin.controller';

describe('EmailTemplateVariableAdminController - Unit tests', () => {
  let sut: EmailTemplateVariableAdminController;
  let createEmailTemplateVariable: CreateEmailTemplateVariable;
  let findAllEmailTemplateVariable: FindAllEmailTemplateVariable;
  let findEmailTemplateVariableById: FindEmailTemplateVariableById;
  let editEmailTemplateVariable: EditEmailTemplateVariable;
  let updateEmailTemplateVariableStatus: UpdateEmailTemplateVariableStatus;
  let deleteEmailTemplateVariable: DeleteEmailTemplateVariable;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [EmailTemplateVariableAdminController],
      providers: [
        { provide: CreateEmailTemplateVariable, useValue: createMock<CreateEmailTemplateVariable>() },
        { provide: FindAllEmailTemplateVariable, useValue: createMock<FindAllEmailTemplateVariable>() },
        { provide: FindEmailTemplateVariableById, useValue: createMock<FindEmailTemplateVariableById>() },
        { provide: EditEmailTemplateVariable, useValue: createMock<EditEmailTemplateVariable>() },
        { provide: UpdateEmailTemplateVariableStatus, useValue: createMock<UpdateEmailTemplateVariableStatus>() },
        { provide: DeleteEmailTemplateVariable, useValue: createMock<DeleteEmailTemplateVariable>() },
      ],
    }).compile();

    sut = module.get(EmailTemplateVariableAdminController);
    createEmailTemplateVariable = module.get(CreateEmailTemplateVariable);
    findAllEmailTemplateVariable = module.get(FindAllEmailTemplateVariable);
    findEmailTemplateVariableById = module.get(FindEmailTemplateVariableById);
    editEmailTemplateVariable = module.get(EditEmailTemplateVariable);
    updateEmailTemplateVariableStatus = module.get(UpdateEmailTemplateVariableStatus);
    deleteEmailTemplateVariable = module.get(DeleteEmailTemplateVariable);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call create.execute with body', async() => {
    const body = createMock<CreateEmailTemplateVariableInputDto>();
    const output = createMock<CreateEmailTemplateVariableOutputDto>();
    jest.spyOn(createEmailTemplateVariable, 'execute').mockResolvedValue(output);

    const result = await sut.create(body);

    expect(result).toEqual(output);
    expect(createEmailTemplateVariable.execute).toHaveBeenCalledWith(body);
  });

  it('should call findAll.execute with queries', async() => {
    const queries = createMock<FindAllEmailTemplateVariableQueryDto>();
    const output = createMock<IPagination<EmailTemplateVariableDto>>();
    jest.spyOn(findAllEmailTemplateVariable, 'execute').mockResolvedValue(output);

    const result = await sut.findAll(queries);

    expect(result).toEqual(output);
    expect(findAllEmailTemplateVariable.execute).toHaveBeenCalledWith(queries);
  });

  it('should call findOne.execute with params.id', async() => {
    const params = createMock<Params>({ id: 1 });
    const output = createMock<EmailTemplateVariableDto>();
    jest.spyOn(findEmailTemplateVariableById, 'execute').mockResolvedValue(output);

    const result = await sut.findOne(params);

    expect(result).toEqual(output);
    expect(findEmailTemplateVariableById.execute).toHaveBeenCalledWith(1);
  });

  it('should call updateStatus.execute with params.id', async() => {
    const params = createMock<Params>({ id: 1 });
    const output = createMock<SuccessMessage>();
    jest.spyOn(updateEmailTemplateVariableStatus, 'execute').mockResolvedValue(output);

    const result = await sut.updateStatus(params);

    expect(result).toEqual(output);
    expect(updateEmailTemplateVariableStatus.execute).toHaveBeenCalledWith(1);
  });

  it('should call update.execute with params.id and body', async() => {
    const params = createMock<Params>({ id: 1 });
    const body = createMock<EditEmailTemplateVariableInputDto>();
    const output = createMock<SuccessMessage>();
    jest.spyOn(editEmailTemplateVariable, 'execute').mockResolvedValue(output);

    const result = await sut.update(params, body);

    expect(result).toEqual(output);
    expect(editEmailTemplateVariable.execute).toHaveBeenCalledWith(1, body);
  });

  it('should call remove.execute with params.id', async() => {
    const params = createMock<Params>({ id: 1 });
    const output = createMock<SuccessMessage>();
    jest.spyOn(deleteEmailTemplateVariable, 'execute').mockResolvedValue(output);

    const result = await sut.remove(params);

    expect(result).toEqual(output);
    expect(deleteEmailTemplateVariable.execute).toHaveBeenCalledWith(1);
  });
});
