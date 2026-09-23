import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { EmailTemplateDto } from 'src/app/global/email-template/application/dtos/email-template.dto';
import { CreateEmailTemplate } from 'src/app/global/email-template/application/usecases/create-email-template/create-email-template.service';
import { CreateEmailTemplateInputDto, CreateEmailTemplateOutputDto } from 'src/app/global/email-template/application/usecases/create-email-template/dtos/create-email-template.dto';
import { DeleteEmailTemplate } from 'src/app/global/email-template/application/usecases/delete-email-template/delete-email-template.service';
import { EditEmailTemplateInputDto } from 'src/app/global/email-template/application/usecases/edit-email-template/dtos/edit-email-template.dto';
import { EditEmailTemplate } from 'src/app/global/email-template/application/usecases/edit-email-template/edit-email-template.service';
import { FindAllEmailTemplateQueryDto } from 'src/app/global/email-template/application/usecases/find-all-email-template/dtos/find-all-email-template.dto';
import { FindAllEmailTemplate } from 'src/app/global/email-template/application/usecases/find-all-email-template/find-all-email-template.service';
import { FindEmailTemplateById } from 'src/app/global/email-template/application/usecases/find-email-template-by-id/find-email-template-by-id.service';
import { RenderEmailTemplateInputDto, RenderEmailTemplateOutputDto } from 'src/app/global/email-template/application/usecases/render-email-template/dtos/render-email-template.dto';
import { RenderEmailTemplate } from 'src/app/global/email-template/application/usecases/render-email-template/render-email-template.service';
import { UpdateEmailTemplateStatus } from 'src/app/global/email-template/application/usecases/update-email-template-status/update-email-template-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { EmailTemplateAdminController } from './email-template-admin.controller';

describe('EmailTemplateAdminController - Unit tests', () => {
  let sut: EmailTemplateAdminController;
  let createEmailTemplate: CreateEmailTemplate;
  let findAllEmailTemplate: FindAllEmailTemplate;
  let findEmailTemplateById: FindEmailTemplateById;
  let renderEmailTemplate: RenderEmailTemplate;
  let editEmailTemplate: EditEmailTemplate;
  let updateEmailTemplateStatus: UpdateEmailTemplateStatus;
  let deleteEmailTemplate: DeleteEmailTemplate;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [EmailTemplateAdminController],
      providers: [
        { provide: CreateEmailTemplate, useValue: createMock<CreateEmailTemplate>() },
        { provide: FindAllEmailTemplate, useValue: createMock<FindAllEmailTemplate>() },
        { provide: FindEmailTemplateById, useValue: createMock<FindEmailTemplateById>() },
        { provide: RenderEmailTemplate, useValue: createMock<RenderEmailTemplate>() },
        { provide: EditEmailTemplate, useValue: createMock<EditEmailTemplate>() },
        { provide: UpdateEmailTemplateStatus, useValue: createMock<UpdateEmailTemplateStatus>() },
        { provide: DeleteEmailTemplate, useValue: createMock<DeleteEmailTemplate>() },
      ],
    }).compile();

    sut = module.get(EmailTemplateAdminController);
    createEmailTemplate = module.get(CreateEmailTemplate);
    findAllEmailTemplate = module.get(FindAllEmailTemplate);
    findEmailTemplateById = module.get(FindEmailTemplateById);
    renderEmailTemplate = module.get(RenderEmailTemplate);
    editEmailTemplate = module.get(EditEmailTemplate);
    updateEmailTemplateStatus = module.get(UpdateEmailTemplateStatus);
    deleteEmailTemplate = module.get(DeleteEmailTemplate);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call create.execute with body', async() => {
    const body = createMock<CreateEmailTemplateInputDto>();
    const output = createMock<CreateEmailTemplateOutputDto>();
    jest.spyOn(createEmailTemplate, 'execute').mockResolvedValue(output);

    const result = await sut.create(body);

    expect(result).toEqual(output);
    expect(createEmailTemplate.execute).toHaveBeenCalledWith(body);
  });

  it('should call findAll.execute with queries', async() => {
    const queries = createMock<FindAllEmailTemplateQueryDto>();
    const output = createMock<IPagination<EmailTemplateDto>>();
    jest.spyOn(findAllEmailTemplate, 'execute').mockResolvedValue(output);

    const result = await sut.findAll(queries);

    expect(result).toEqual(output);
    expect(findAllEmailTemplate.execute).toHaveBeenCalledWith(queries);
  });

  it('should call render.execute with params.id and body', async() => {
    const params = createMock<Params>({ id: 7 });
    const body = createMock<RenderEmailTemplateInputDto>();
    const output = createMock<RenderEmailTemplateOutputDto>();
    jest.spyOn(renderEmailTemplate, 'execute').mockResolvedValue(output);

    const result = await sut.render(params, body);

    expect(result).toEqual(output);
    expect(renderEmailTemplate.execute).toHaveBeenCalledWith(7, body);
  });

  it('should call findOne.execute with params.id', async() => {
    const params = createMock<Params>({ id: 1 });
    const output = createMock<EmailTemplateDto>();
    jest.spyOn(findEmailTemplateById, 'execute').mockResolvedValue(output);

    const result = await sut.findOne(params);

    expect(findEmailTemplateById.execute).toHaveBeenCalledWith(1);
    expect(result).toEqual(output);
  });

  it('should call updateStatus.execute with params.id', async() => {
    const params = createMock<Params>({ id: 1 });
    const output = createMock<SuccessMessage>();
    jest.spyOn(updateEmailTemplateStatus, 'execute').mockResolvedValue(output);

    await sut.updateStatus(params);

    expect(updateEmailTemplateStatus.execute).toHaveBeenCalledWith(1);
  });

  it('should call update.execute with params.id and body', async() => {
    const params = createMock<Params>({ id: 1 });
    const body = createMock<EditEmailTemplateInputDto>();
    const output = createMock<SuccessMessage>();
    jest.spyOn(editEmailTemplate, 'execute').mockResolvedValue(output);

    await sut.update(params, body);

    expect(editEmailTemplate.execute).toHaveBeenCalledWith(1, body);
  });

  it('should call remove.execute with params.id', async() => {
    const params = createMock<Params>({ id: 1 });
    const output = createMock<SuccessMessage>();
    jest.spyOn(deleteEmailTemplate, 'execute').mockResolvedValue(output);

    await sut.remove(params);

    expect(deleteEmailTemplate.execute).toHaveBeenCalledWith(1);
  });
});
