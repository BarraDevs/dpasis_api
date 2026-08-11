import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { CreateCompanyNfsConfig } from 'src/app/company/company-nfs-config/application/usecases/create-company-nfs-config/create-company-nfs-config.service';
import { CreateCompanyNfsConfigInputDto, CreateCompanyNfsConfigOutputDto } from 'src/app/company/company-nfs-config/application/usecases/create-company-nfs-config/dtos/create-company-nfs-config.dto';
import { EditCompanyNfsConfigInputDto } from 'src/app/company/company-nfs-config/application/usecases/edit-company-nfs-config/dtos/edit-company-nfs-config.dto';
import { EditCompanyNfsConfig } from 'src/app/company/company-nfs-config/application/usecases/edit-company-nfs-config/edit-company-nfs-config.service';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params, ParamsCompanyId } from 'src/infra/validators/class/dtos/params';
import { CompanyNfsConfigAdminController } from './company-nfs-config-admin.controller';

describe('CompanyNfsConfigAdminController - Unit tests', () => {
  let sut: CompanyNfsConfigAdminController;
  let createCompanyNfsConfig: CreateCompanyNfsConfig;
  let editCompanyNfsConfig: EditCompanyNfsConfig;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CompanyNfsConfigAdminController],
      providers: [
        { provide: CreateCompanyNfsConfig, useValue: createMock<CreateCompanyNfsConfig>() },
        { provide: EditCompanyNfsConfig, useValue: createMock<EditCompanyNfsConfig>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
      ],
    }).compile();

    sut = module.get(CompanyNfsConfigAdminController);
    createCompanyNfsConfig = module.get(CreateCompanyNfsConfig);
    editCompanyNfsConfig = module.get(EditCompanyNfsConfig);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call createCompanyNfsConfig.execute with body', async() => {
    const body = createMock<CreateCompanyNfsConfigInputDto>();
    const output = createMock<CreateCompanyNfsConfigOutputDto>();
    const createSpy = jest.spyOn(createCompanyNfsConfig, 'execute').mockResolvedValue(output);

    const result = await sut.create(body);

    expect(createSpy).toHaveBeenCalledWith(body);
    expect(result).toEqual(output);
  });

  it('should call findCompanyNfsConfigByCompanyId.execute with companyId', async() => {
    const output = createMock<CompanyNfsConfigDto>();
    const findSpy = jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(output);

    const result = await sut.findByCompanyId({ companyId: 10 } as ParamsCompanyId);

    expect(findSpy).toHaveBeenCalledWith(10);
    expect(result).toEqual(output);
  });

  it('should call editCompanyNfsConfig.execute with id and body', async() => {
    const body = createMock<EditCompanyNfsConfigInputDto>();
    const output = createMock<SuccessMessage>();
    const editSpy = jest.spyOn(editCompanyNfsConfig, 'execute').mockResolvedValue(output);

    const result = await sut.update({ id: 5 } as Params, body);

    expect(editSpy).toHaveBeenCalledWith(5, body);
    expect(result).toEqual(output);
  });
});
