import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ProposalValidityDto } from 'src/app/global/proposal-validity/application/dtos/proposal-validity.dto';
import { CreateProposalValidity } from 'src/app/global/proposal-validity/application/usecases/create-proposal-validity/create-proposal-validity.service';
import { CreateProposalValidityInputDto, CreateProposalValidityOutputDto } from 'src/app/global/proposal-validity/application/usecases/create-proposal-validity/dtos/create-proposal-validity.dto';
import { DeleteProposalValidity } from 'src/app/global/proposal-validity/application/usecases/delete-proposal-validity/delete-proposal-validity.service';
import { EditProposalValidityInputDto } from 'src/app/global/proposal-validity/application/usecases/edit-proposal-validity/dtos/edit-proposal-validity.dto';
import { EditProposalValidity } from 'src/app/global/proposal-validity/application/usecases/edit-proposal-validity/edit-proposal-validity.service';
import { FindAllProposalValidityQueryDto } from 'src/app/global/proposal-validity/application/usecases/find-all-proposal-validity/dtos/find-all-proposal-validity.dto';
import { FindAllProposalValidity } from 'src/app/global/proposal-validity/application/usecases/find-all-proposal-validity/find-all-proposal-validity.service';
import { FindProposalValidityById } from 'src/app/global/proposal-validity/application/usecases/find-proposal-validity-by-id/find-proposal-validity-by-id.service';
import { UpdateProposalValidityStatus } from 'src/app/global/proposal-validity/application/usecases/update-proposal-validity-status/update-proposal-validity-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProposalValidityAdminController } from './proposal-validity-admin.controller';

describe('ProposalValidityAdminController - Unit tests', () => {
  let sut: ProposalValidityAdminController;
  let createProposalValidity: CreateProposalValidity;
  let findAllProposalValidity: FindAllProposalValidity;
  let findProposalValidityById: FindProposalValidityById;
  let editProposalValidity: EditProposalValidity;
  let updateProposalValidityStatus: UpdateProposalValidityStatus;
  let deleteProposalValidity: DeleteProposalValidity;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [ProposalValidityAdminController],
      providers: [
        { provide: CreateProposalValidity, useValue: createMock<CreateProposalValidity>() },
        { provide: FindAllProposalValidity, useValue: createMock<FindAllProposalValidity>() },
        { provide: FindProposalValidityById, useValue: createMock<FindProposalValidityById>() },
        { provide: EditProposalValidity, useValue: createMock<EditProposalValidity>() },
        { provide: UpdateProposalValidityStatus, useValue: createMock<UpdateProposalValidityStatus>() },
        { provide: DeleteProposalValidity, useValue: createMock<DeleteProposalValidity>() },
      ],
    }).compile();

    sut = module.get(ProposalValidityAdminController);
    createProposalValidity = module.get(CreateProposalValidity);
    findAllProposalValidity = module.get(FindAllProposalValidity);
    findProposalValidityById = module.get(FindProposalValidityById);
    editProposalValidity = module.get(EditProposalValidity);
    updateProposalValidityStatus = module.get(UpdateProposalValidityStatus);
    deleteProposalValidity = module.get(DeleteProposalValidity);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createProposalValidity.execute with body', async() => {
      const body = createMock<CreateProposalValidityInputDto>();
      const output = createMock<CreateProposalValidityOutputDto>();
      const createSpy = jest.spyOn(createProposalValidity, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllProposalValidity.execute with queries', async() => {
      const queries = createMock<FindAllProposalValidityQueryDto>();
      const output = createMock<IPagination<ProposalValidityDto>>();
      const findAllSpy = jest.spyOn(findAllProposalValidity, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findOne', () => {
    it('should call findProposalValidityById.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<ProposalValidityDto>();
      const findOneSpy = jest.spyOn(findProposalValidityById, 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('updateStatus', () => {
    it('should call updateProposalValidityStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest.spyOn(updateProposalValidityStatus, 'execute').mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    it('should call editProposalValidity.execute with params.id and body', async() => {
      const params = createMock<Params>();
      const body = createMock<EditProposalValidityInputDto>();
      const output = createMock<SuccessMessage>();
      const updateSpy = jest.spyOn(editProposalValidity, 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(result).toEqual(output);
      expect(updateSpy).toHaveBeenCalledWith(params.id, body);
    });
  });

  describe('remove', () => {
    it('should call deleteProposalValidity.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteProposalValidity, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
