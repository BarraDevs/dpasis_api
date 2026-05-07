import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
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
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/proposal-validity')
@RequiredRoles(AccountRole.ADMIN)
export class ProposalValidityAdminController {
  constructor(
    private readonly createProposalValidity: CreateProposalValidity,
    private readonly findAllProposalValidity: FindAllProposalValidity,
    private readonly findProposalValidityById: FindProposalValidityById,
    private readonly editProposalValidity: EditProposalValidity,
    private readonly updateProposalValidityStatus: UpdateProposalValidityStatus,
    private readonly deleteProposalValidity: DeleteProposalValidity,
  ) {}

  @Post()
  @RequiredClaims(Claim.PROPOSAL_VALIDITY_WRITE)
  @Swagger({
    tags: ['Validades'],
    summary: 'Criar validade',
    applyBadRequest: true,
    createdResponse: CreateProposalValidityOutputDto,
  })
  public create(@Body() body: CreateProposalValidityInputDto): Promise<CreateProposalValidityOutputDto> {
    return this.createProposalValidity.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.PROPOSAL_VALIDITY_READ)
  @Swagger({
    tags: ['Validades'],
    summary: 'Listar validades com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ProposalValidityDto,
  })
  public findAll(@Query() queries: FindAllProposalValidityQueryDto): Promise<IPagination<ProposalValidityDto>> {
    return this.findAllProposalValidity.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.PROPOSAL_VALIDITY_READ)
  @Swagger({
    tags: ['Validades'],
    summary: 'Buscar validade por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ProposalValidityDto,
  })
  public findOne(@Param() params: Params): Promise<ProposalValidityDto> {
    return this.findProposalValidityById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.PROPOSAL_VALIDITY_WRITE)
  @Swagger({
    tags: ['Validades'],
    summary: 'Inverter status ativo da validade',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateProposalValidityStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.PROPOSAL_VALIDITY_WRITE)
  @Swagger({
    tags: ['Validades'],
    summary: 'Editar validade',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditProposalValidityInputDto): Promise<SuccessMessage> {
    return this.editProposalValidity.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.PROPOSAL_VALIDITY_WRITE)
  @Swagger({
    tags: ['Validades'],
    summary: 'Deletar validade',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteProposalValidity.execute(params.id);
  }
}
