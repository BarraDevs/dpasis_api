import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AdminDetailDto, AdminListDto } from 'src/app/admin/application/dtos/admin.dto';
import { ActivateAdmin } from 'src/app/admin/application/usecases/activate-admin/activate-admin.service';
import { CreateAdmin } from 'src/app/admin/application/usecases/create-admin/create-admin.service';
import { CreateAdminInputDto, CreateAdminOutputDto } from 'src/app/admin/application/usecases/create-admin/dtos/create-admin.dto';
import { EditAdminInputDto } from 'src/app/admin/application/usecases/edit-admin/dtos/edit-admin.dto';
import { EditAdmin } from 'src/app/admin/application/usecases/edit-admin/edit-admin.service';
import { FindAdminById } from 'src/app/admin/application/usecases/find-admin-by-id/find-admin-by-id.service';
import { FindAllAdminQueryDto } from 'src/app/admin/application/usecases/find-all-admin/dtos/find-all-admin.dto';
import { FindAllAdmin } from 'src/app/admin/application/usecases/find-all-admin/find-all-admin.service';
import { FindPermissionSubjects } from 'src/app/admin/application/usecases/find-permission-subjects/find-permission-subjects.service';
import { InactivateAdmin } from 'src/app/admin/application/usecases/inactivate-admin/inactivate-admin.service';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AdminAdminController } from './admin-admin.controller';

describe('AdminAdminController - Unit tests', () => {
  let sut: AdminAdminController;
  let activateAdmin: ActivateAdmin;
  let createAdmin: CreateAdmin;
  let editAdmin: EditAdmin;
  let findAllAdmin: FindAllAdmin;
  let findAdminById: FindAdminById;
  let findPermissions: FindPermissionSubjects;
  let inactivateAdmin: InactivateAdmin;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [AdminAdminController],
      providers: [
        { provide: ActivateAdmin, useValue: createMock<ActivateAdmin>() },
        { provide: CreateAdmin, useValue: createMock<CreateAdmin>() },
        { provide: EditAdmin, useValue: createMock<EditAdmin>() },
        { provide: FindAllAdmin, useValue: createMock<FindAllAdmin>() },
        { provide: FindAdminById, useValue: createMock<FindAdminById>() },
        { provide: FindPermissionSubjects, useValue: createMock<FindPermissionSubjects>() },
        { provide: InactivateAdmin, useValue: createMock<InactivateAdmin>() },
      ],
    }).compile();

    sut = module.get(AdminAdminController);
    activateAdmin = module.get(ActivateAdmin);
    createAdmin = module.get(CreateAdmin);
    editAdmin = module.get(EditAdmin);
    findAllAdmin = module.get(FindAllAdmin);
    findAdminById = module.get(FindAdminById);
    findPermissions = module.get(FindPermissionSubjects);
    inactivateAdmin = module.get(InactivateAdmin);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createAdmin.execute with body', async() => {
      const body = createMock<CreateAdminInputDto>();
      const output = createMock<CreateAdminOutputDto>();
      const createSpy = jest.spyOn(createAdmin, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findPermissions', () => {
    it('should call findPermissions.execute', async() => {
      const output = [{ subject: ClaimSubject.Bank, label: 'Bancos' }];
      const spy = jest.spyOn(findPermissions, 'execute').mockReturnValue(output);

      const result = sut.findPermissions();

      expect(result).toEqual(output);
      expect(spy).toHaveBeenCalledWith();
    });
  });

  describe('findAll', () => {
    it('should call findAllAdmin.execute with queries', async() => {
      const queries = createMock<FindAllAdminQueryDto>();
      const output = createMock<IPagination<AdminListDto>>();
      const findAllSpy = jest.spyOn(findAllAdmin, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findAdminById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<AdminDetailDto>();
      const findOneSpy = jest.spyOn(findAdminById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('activate', () => {
    it('should call activateAdmin.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const activateSpy = jest.spyOn(activateAdmin, 'execute').mockResolvedValue(output);

      const result = await sut.activate(params);

      expect(result).toEqual(output);
      expect(activateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('inactivate', () => {
    it('should call inactivateAdmin.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const inactivateSpy = jest.spyOn(inactivateAdmin, 'execute').mockResolvedValue(output);

      const result = await sut.inactivate(params);

      expect(result).toEqual(output);
      expect(inactivateSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editAdmin.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditAdminInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editAdmin, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });
});
