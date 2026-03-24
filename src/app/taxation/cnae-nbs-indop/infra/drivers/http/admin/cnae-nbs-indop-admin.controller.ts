import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CnaeNbsIndopDto } from 'src/app/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';
import { CreateCnaeNbsIndop } from 'src/app/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/create-cnae-nbs-indop.service';
import {
  CreateCnaeNbsIndopInputDto,
  CreateCnaeNbsIndopOutputDto,
} from 'src/app/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { DeleteCnaeNbsIndop } from 'src/app/taxation/cnae-nbs-indop/application/usecases/delete-cnae-nbs-indop/delete-cnae-nbs-indop.service';
import { FindAllCnaeNbsIndopQueryDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndop } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/find-all-cnae-nbs-indop.service';
import { FindCnaesForSelect } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-cnaes-for-select/find-cnaes-for-select.service';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-indops-by-cnae-and-nbs-for-select/dtos/find-indops-by-cnae-and-nbs-for-select.dto';
import { FindIndopsByCnaeAndNbsForSelect } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-indops-by-cnae-and-nbs-for-select/find-indops-by-cnae-and-nbs-for-select.service';
import { FindNbsByCnaeForSelectQueryDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-nbs-by-cnae-for-select/dtos/find-nbs-by-cnae-for-select.dto';
import { FindNbsByCnaeForSelect } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-nbs-by-cnae-for-select/find-nbs-by-cnae-for-select.service';
import { UpdateCnaeNbsIndopStatus } from 'src/app/taxation/cnae-nbs-indop/application/usecases/update-cnae-nbs-indop-status/update-cnae-nbs-indop-status.service';
import { CnaeDto } from 'src/app/taxation/cnae/application/dtos/cnae.dto';
import { IndopDto } from 'src/app/taxation/indop/application/dtos/indop.dto';
import { NbsDto } from 'src/app/taxation/nbs/application/dtos/nbs.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/cnae-nbs-indop')
@RequiredRoles(AccountRole.ADMIN)
export class CnaeNbsIndopAdminController {
  constructor(
    private readonly createCnaeNbsIndop: CreateCnaeNbsIndop,
    private readonly findAllCnaeNbsIndop: FindAllCnaeNbsIndop,
    private readonly updateCnaeNbsIndopStatus: UpdateCnaeNbsIndopStatus,
    private readonly deleteCnaeNbsIndop: DeleteCnaeNbsIndop,
    private readonly findCnaesForSelectUseCase: FindCnaesForSelect,
    private readonly findNbsByCnaeForSelectUseCase: FindNbsByCnaeForSelect,
    private readonly findIndopsByCnaeAndNbsForSelectUseCase: FindIndopsByCnaeAndNbsForSelect,
  ) {}

  @Post()
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Criar nova combinação CNAE + NBS + INDOP',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    createdResponse: CreateCnaeNbsIndopOutputDto,
  })
  public create(@Body() body: CreateCnaeNbsIndopInputDto): Promise<CreateCnaeNbsIndopOutputDto> {
    return this.createCnaeNbsIndop.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Listar combinações com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: CnaeNbsIndopDto,
  })
  public findAll(@Query() queries: FindAllCnaeNbsIndopQueryDto): Promise<IPagination<CnaeNbsIndopDto>> {
    return this.findAllCnaeNbsIndop.execute(queries);
  }

  @Get('cnaes')
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Listar CNAEs para select (combinações existentes)',
    applyBadRequest: true,
    okResponse: CnaeDto,
  })
  public findCnaesForSelect(): Promise<CnaeDto[]> {
    return this.findCnaesForSelectUseCase.execute();
  }

  @Get('nbs')
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Listar NBSs para select (filtrado por CNAE)',
    applyBadRequest: true,
    okResponse: NbsDto,
  })
  public findNbsByCnaeForSelect(@Query() queries: FindNbsByCnaeForSelectQueryDto): Promise<NbsDto[]> {
    return this.findNbsByCnaeForSelectUseCase.execute(queries);
  }

  @Get('indops')
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Listar INDOPs para select (filtrado por CNAE e NBS)',
    applyBadRequest: true,
    okResponse: IndopDto,
  })
  public findIndopsByCnaeAndNbsForSelect(@Query() queries: FindIndopsByCnaeAndNbsForSelectQueryDto): Promise<IndopDto[]> {
    return this.findIndopsByCnaeAndNbsForSelectUseCase.execute(queries);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Inverter status ativo da combinação CNAE/NBS/INDOP',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateCnaeNbsIndopStatus.execute(params.id);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Tributação - CNAE/NBS/INDOP'],
    summary: 'Excluir combinação',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteCnaeNbsIndop.execute(params.id);
  }
}
