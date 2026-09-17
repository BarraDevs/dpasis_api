import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CashFlowEntryDto } from 'src/app/cash-flow-entry/application/dtos/cash-flow-entry.dto';
import { CreateCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/create-cash-flow-entry/create-cash-flow-entry.service';
import {
  CreateCashFlowEntryInputDto,
  CreateCashFlowEntryOutputDto,
} from 'src/app/cash-flow-entry/application/usecases/create-cash-flow-entry/dtos/create-cash-flow-entry.dto';
import { DeleteCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/delete-cash-flow-entry/delete-cash-flow-entry.service';
import { EditCashFlowEntryInputDto } from 'src/app/cash-flow-entry/application/usecases/edit-cash-flow-entry/dtos/edit-cash-flow-entry.dto';
import { EditCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/edit-cash-flow-entry/edit-cash-flow-entry.service';
import { FindAllCashFlowEntryQueryDto } from 'src/app/cash-flow-entry/application/usecases/find-all-cash-flow-entry/dtos/find-all-cash-flow-entry.dto';
import { FindAllCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/find-all-cash-flow-entry/find-all-cash-flow-entry.service';
import { FindCashFlowEntryById } from 'src/app/cash-flow-entry/application/usecases/find-cash-flow-entry-by-id/find-cash-flow-entry-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CashFlowEntryAdminController } from './cash-flow-entry-admin.controller';

describe('CashFlowEntryAdminController - Unit tests', () => {
  let sut: CashFlowEntryAdminController;
  let createCashFlowEntry: CreateCashFlowEntry;
  let findAllCashFlowEntry: FindAllCashFlowEntry;
  let findCashFlowEntryById: FindCashFlowEntryById;
  let editCashFlowEntry: EditCashFlowEntry;
  let deleteCashFlowEntry: DeleteCashFlowEntry;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [CashFlowEntryAdminController],
      providers: [
        { provide: CreateCashFlowEntry, useValue: createMock<CreateCashFlowEntry>() },
        { provide: FindAllCashFlowEntry, useValue: createMock<FindAllCashFlowEntry>() },
        { provide: FindCashFlowEntryById, useValue: createMock<FindCashFlowEntryById>() },
        { provide: EditCashFlowEntry, useValue: createMock<EditCashFlowEntry>() },
        { provide: DeleteCashFlowEntry, useValue: createMock<DeleteCashFlowEntry>() },
      ],
    }).compile();

    sut = module.get(CashFlowEntryAdminController);
    createCashFlowEntry = module.get(CreateCashFlowEntry);
    findAllCashFlowEntry = module.get(FindAllCashFlowEntry);
    findCashFlowEntryById = module.get(FindCashFlowEntryById);
    editCashFlowEntry = module.get(EditCashFlowEntry);
    deleteCashFlowEntry = module.get(DeleteCashFlowEntry);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call createCashFlowEntry.execute with body', async() => {
    const body = createMock<CreateCashFlowEntryInputDto>();
    const output = createMock<CreateCashFlowEntryOutputDto>();
    jest.spyOn(createCashFlowEntry, 'execute').mockResolvedValue(output);

    const result = await sut.create(body);

    expect(result).toEqual(output);
    expect(createCashFlowEntry.execute).toHaveBeenCalledWith(body);
  });

  it('should call findAllCashFlowEntry.execute with queries', async() => {
    const queries = createMock<FindAllCashFlowEntryQueryDto>();
    const output = createMock<IPagination<CashFlowEntryDto>>();
    jest.spyOn(findAllCashFlowEntry, 'execute').mockResolvedValue(output);

    const result = await sut.findAll(queries);

    expect(result).toEqual(output);
    expect(findAllCashFlowEntry.execute).toHaveBeenCalledWith(queries);
  });

  it('should call findCashFlowEntryById.execute with params.id', async() => {
    const params = createMock<Params>({ id: 3 });
    const output = createMock<CashFlowEntryDto>();
    jest.spyOn(findCashFlowEntryById, 'execute').mockResolvedValue(output);

    const result = await sut.findOne(params);

    expect(result).toEqual(output);
    expect(findCashFlowEntryById.execute).toHaveBeenCalledWith(3);
  });

  it('should call editCashFlowEntry.execute with params.id and body', async() => {
    const params = createMock<Params>({ id: 3 });
    const body = createMock<EditCashFlowEntryInputDto>();
    const output = createMock<SuccessMessage>();
    jest.spyOn(editCashFlowEntry, 'execute').mockResolvedValue(output);

    const result = await sut.update(params, body);

    expect(result).toEqual(output);
    expect(editCashFlowEntry.execute).toHaveBeenCalledWith(3, body);
  });

  it('should call deleteCashFlowEntry.execute with params.id', async() => {
    const params = createMock<Params>({ id: 3 });
    const output = createMock<SuccessMessage>();
    jest.spyOn(deleteCashFlowEntry, 'execute').mockResolvedValue(output);

    const result = await sut.remove(params);

    expect(result).toEqual(output);
    expect(deleteCashFlowEntry.execute).toHaveBeenCalledWith(3);
  });
});
