import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { ActivateCompany } from 'src/app/company/company/application/usecases/activate-company/activate-company.service';
import { CreateCompany } from 'src/app/company/company/application/usecases/create-company/create-company.service';
import { CreateCompanyInputDto, CreateCompanyOutputDto } from 'src/app/company/company/application/usecases/create-company/dtos/create-company.dto';
import { DeactivateCompany } from 'src/app/company/company/application/usecases/deactivate-company/deactivate-company.service';
import { EditCompanyInputDto } from 'src/app/company/company/application/usecases/edit-company/dtos/edit-company.dto';
import { EditCompany } from 'src/app/company/company/application/usecases/edit-company/edit-company.service';
import { FindAllCompanyQueryDto } from 'src/app/company/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { FindAllCompany } from 'src/app/company/company/application/usecases/find-all-company/find-all-company.service';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CompanyAdminController } from './company-admin.controller';

describe('CompanyAdminController - Unit tests', () => {
  let sut: CompanyAdminController;
  let activateCompanyService: ActivateCompany;
  let createCompanyService: CreateCompany;
  let deactivateCompanyService: DeactivateCompany;
  let findAllCompanyService: FindAllCompany;
  let findCompanyByIdService: FindCompanyById;
  let editCompanyService: EditCompany;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CompanyAdminController],
      providers: [
        { provide: ActivateCompany, useValue: createMock<ActivateCompany>() },
        { provide: CreateCompany, useValue: createMock<CreateCompany>() },
        { provide: DeactivateCompany, useValue: createMock<DeactivateCompany>() },
        { provide: FindAllCompany, useValue: createMock<FindAllCompany>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: EditCompany, useValue: createMock<EditCompany>() },
      ],
    }).compile();

    sut = module.get(CompanyAdminController);
    activateCompanyService = module.get(ActivateCompany);
    createCompanyService = module.get(CreateCompany);
    deactivateCompanyService = module.get(DeactivateCompany);
    findAllCompanyService = module.get(FindAllCompany);
    findCompanyByIdService = module.get(FindCompanyById);
    editCompanyService = module.get(EditCompany);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createCompany.execute with body', async() => {
      const body = createMock<CreateCompanyInputDto>();
      const output = createMock<CreateCompanyOutputDto>();
      const createSpy = jest.spyOn(createCompanyService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllCompany.execute with queries', async() => {
      const queries = createMock<FindAllCompanyQueryDto>();
      const output = createMock<IPagination<CompanyDto>>();
      const findAllSpy = jest.spyOn(findAllCompanyService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findCompanyById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<CompanyDto>();
      const findOneSpy = jest.spyOn(findCompanyByIdService, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateCompany.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateCompanyService, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('deactivate', () => {
    it('should call deactivateCompany.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deactivateSpy = jest.spyOn(deactivateCompanyService, 'execute').mockResolvedValue(output);

      const result = await sut.deactivate(params);

      expect(result).toEqual(output);
      expect(deactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editCompany.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditCompanyInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editCompanyService, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });
});
