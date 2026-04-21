import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CnaeNbsIndopDto } from 'src/app/global/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';
import { CreateCnaeNbsIndop } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/create-cnae-nbs-indop.service';
import {
  CreateCnaeNbsIndopInputDto,
  CreateCnaeNbsIndopOutputDto,
} from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { DeleteCnaeNbsIndop } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/delete-cnae-nbs-indop/delete-cnae-nbs-indop.service';
import { FindAllCnaeNbsIndopQueryDto } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndop } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/find-all-cnae-nbs-indop.service';
import { FindCnaesForSelect } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-cnaes-for-select/find-cnaes-for-select.service';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-indops-by-cnae-and-nbs-for-select/dtos/find-indops-by-cnae-and-nbs-for-select.dto';
import { FindIndopsByCnaeAndNbsForSelect } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-indops-by-cnae-and-nbs-for-select/find-indops-by-cnae-and-nbs-for-select.service';
import { FindNbsByCnaeForSelectQueryDto } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-nbs-by-cnae-for-select/dtos/find-nbs-by-cnae-for-select.dto';
import { FindNbsByCnaeForSelect } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-nbs-by-cnae-for-select/find-nbs-by-cnae-for-select.service';
import { UpdateCnaeNbsIndopStatus } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/update-cnae-nbs-indop-status/update-cnae-nbs-indop-status.service';
import { CnaeDto } from 'src/app/global/taxation/cnae/application/dtos/cnae.dto';
import { IndopDto } from 'src/app/global/taxation/indop/application/dtos/indop.dto';
import { NbsDto } from 'src/app/global/taxation/nbs/application/dtos/nbs.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CnaeNbsIndopAdminController } from './cnae-nbs-indop-admin.controller';

describe('CnaeNbsIndopAdminController - Unit tests', () => {
  let sut: CnaeNbsIndopAdminController;
  let createCnaeNbsIndopService: CreateCnaeNbsIndop;
  let findAllCnaeNbsIndopService: FindAllCnaeNbsIndop;
  let updateCnaeNbsIndopStatusService: UpdateCnaeNbsIndopStatus;
  let deleteCnaeNbsIndopService: DeleteCnaeNbsIndop;
  let findCnaesForSelectUseCase: FindCnaesForSelect;
  let findNbsByCnaeForSelectUseCase: FindNbsByCnaeForSelect;
  let findIndopsByCnaeAndNbsForSelectUseCase: FindIndopsByCnaeAndNbsForSelect;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CnaeNbsIndopAdminController],
      providers: [
        { provide: CreateCnaeNbsIndop, useValue: createMock<CreateCnaeNbsIndop>() },
        { provide: FindAllCnaeNbsIndop, useValue: createMock<FindAllCnaeNbsIndop>() },
        { provide: UpdateCnaeNbsIndopStatus, useValue: createMock<UpdateCnaeNbsIndopStatus>() },
        { provide: DeleteCnaeNbsIndop, useValue: createMock<DeleteCnaeNbsIndop>() },
        { provide: FindCnaesForSelect, useValue: createMock<FindCnaesForSelect>() },
        { provide: FindNbsByCnaeForSelect, useValue: createMock<FindNbsByCnaeForSelect>() },
        { provide: FindIndopsByCnaeAndNbsForSelect, useValue: createMock<FindIndopsByCnaeAndNbsForSelect>() },
      ],
    }).compile();

    sut = module.get(CnaeNbsIndopAdminController);
    createCnaeNbsIndopService = module.get(CreateCnaeNbsIndop);
    findAllCnaeNbsIndopService = module.get(FindAllCnaeNbsIndop);
    updateCnaeNbsIndopStatusService = module.get(UpdateCnaeNbsIndopStatus);
    deleteCnaeNbsIndopService = module.get(DeleteCnaeNbsIndop);
    findCnaesForSelectUseCase = module.get(FindCnaesForSelect);
    findNbsByCnaeForSelectUseCase = module.get(FindNbsByCnaeForSelect);
    findIndopsByCnaeAndNbsForSelectUseCase = module.get(FindIndopsByCnaeAndNbsForSelect);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createCnaeNbsIndop.execute with body', async() => {
      const body = createMock<CreateCnaeNbsIndopInputDto>();
      const output = createMock<CreateCnaeNbsIndopOutputDto>();
      const createSpy = jest.spyOn(createCnaeNbsIndopService, 'execute').mockResolvedValue(output);

      const result = await sut.create(body);

      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findAll', () => {
    it('should call findAllCnaeNbsIndop.execute with queries', async() => {
      const queries = createMock<FindAllCnaeNbsIndopQueryDto>();
      const output = createMock<IPagination<CnaeNbsIndopDto>>();
      const findAllSpy = jest.spyOn(findAllCnaeNbsIndopService, 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findCnaesForSelect', () => {
    it('should call findCnaesForSelectUseCase.execute', async() => {
      const output = createMock<CnaeDto[]>();
      const executeSpy = jest.spyOn(findCnaesForSelectUseCase, 'execute').mockResolvedValue(output);

      const result = await sut.findCnaesForSelect();

      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalled();
    });
  });

  describe('findNbsByCnaeForSelect', () => {
    it('should call findNbsByCnaeForSelectUseCase.execute with queries', async() => {
      const queries = createMock<FindNbsByCnaeForSelectQueryDto>();
      const output = createMock<NbsDto[]>();
      const executeSpy = jest.spyOn(findNbsByCnaeForSelectUseCase, 'execute').mockResolvedValue(output);

      const result = await sut.findNbsByCnaeForSelect(queries);

      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findIndopsByCnaeAndNbsForSelect', () => {
    it('should call findIndopsByCnaeAndNbsForSelectUseCase.execute with queries', async() => {
      const queries = createMock<FindIndopsByCnaeAndNbsForSelectQueryDto>();
      const output = createMock<IndopDto[]>();
      const executeSpy = jest
        .spyOn(findIndopsByCnaeAndNbsForSelectUseCase, 'execute')
        .mockResolvedValue(output);

      const result = await sut.findIndopsByCnaeAndNbsForSelect(queries);

      expect(result).toEqual(output);
      expect(executeSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('updateStatus', () => {
    it('should call updateCnaeNbsIndopStatus.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const updateStatusSpy = jest
        .spyOn(updateCnaeNbsIndopStatusService, 'execute')
        .mockResolvedValue(output);

      const result = await sut.updateStatus(params);

      expect(result).toEqual(output);
      expect(updateStatusSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('remove', () => {
    it('should call deleteCnaeNbsIndop.execute with params.id', async() => {
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const removeSpy = jest.spyOn(deleteCnaeNbsIndopService, 'execute').mockResolvedValue(output);

      const result = await sut.remove(params);

      expect(result).toEqual(output);
      expect(removeSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
