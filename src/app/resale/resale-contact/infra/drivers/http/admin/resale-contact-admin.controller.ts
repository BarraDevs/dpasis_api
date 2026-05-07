import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ActivateResaleContact } from 'src/app/resale/resale-contact/application/usecases/activate-resale-contact/activate-resale-contact.service';
import { CreateResaleContact } from 'src/app/resale/resale-contact/application/usecases/create-resale-contact/create-resale-contact.service';
import {
  CreateResaleContactInputDto,
  CreateResaleContactOutputDto,
} from 'src/app/resale/resale-contact/application/usecases/create-resale-contact/dtos/create-resale-contact.dto';
import { DeactivateResaleContact } from 'src/app/resale/resale-contact/application/usecases/deactivate-resale-contact/deactivate-resale-contact.service';
import { DeleteResaleContact } from 'src/app/resale/resale-contact/application/usecases/delete-resale-contact/delete-resale-contact.service';
import { EditResaleContactInputDto } from 'src/app/resale/resale-contact/application/usecases/edit-resale-contact/dtos/edit-resale-contact.dto';
import { EditResaleContact } from 'src/app/resale/resale-contact/application/usecases/edit-resale-contact/edit-resale-contact.service';
import { FindAllResaleContactQueryDto } from 'src/app/resale/resale-contact/application/usecases/find-all-resale-contact/dtos/find-all-resale-contact.dto';
import { FindAllResaleContact } from 'src/app/resale/resale-contact/application/usecases/find-all-resale-contact/find-all-resale-contact.service';
import { FindResaleContactById } from 'src/app/resale/resale-contact/application/usecases/find-resale-contact-by-id/find-resale-contact-by-id.service';
import { ResaleContactWireSwaggerDto } from 'src/app/resale/resale-contact/infra/drivers/http/dtos/resale-contact-wire.swagger.dto';
import {
  mapPaginationResaleContactWire,
  mapResaleContactDtoWire,
  parseResaleHexToDecimal,
  ResaleContactWireDto,
} from 'src/app/resale/resale/infra/drivers/http/resale-id-http.codec';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/resale-contact')
@RequiredRoles(AccountRole.ADMIN)
export class ResaleContactAdminController {
  constructor(
    private readonly createResaleContact: CreateResaleContact,
    private readonly findAllResaleContact: FindAllResaleContact,
    private readonly findResaleContactById: FindResaleContactById,
    private readonly editResaleContact: EditResaleContact,
    private readonly activateResaleContact: ActivateResaleContact,
    private readonly deactivateResaleContact: DeactivateResaleContact,
    private readonly deleteResaleContact: DeleteResaleContact,
  ) {}

  @Post()
  @RequiredClaims(Claim.RESALE_CONTACT_WRITE)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Criar novo contato de revenda',
    applyBadRequest: true,
    createdResponse: CreateResaleContactOutputDto,
  })
  public create(@Body() body: CreateResaleContactInputDto): Promise<CreateResaleContactOutputDto> {
    return this.createResaleContact.execute({
      ...body,
      resaleId: parseResaleHexToDecimal(body.resaleId),
    });
  }

  @Get()
  @RequiredClaims(Claim.RESALE_CONTACT_READ)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Listar contatos de revenda com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ResaleContactWireSwaggerDto,
  })
  public async findAll(
    @Query() queries: FindAllResaleContactQueryDto,
  ): Promise<IPagination<ResaleContactWireDto>> {
    const { resaleId: resaleIdHex, ...rest } = queries;
    const page = await this.findAllResaleContact.execute({
      ...rest,
      resaleId: parseResaleHexToDecimal(resaleIdHex),
    });
    return mapPaginationResaleContactWire(page);
  }

  @Get(':id')
  @RequiredClaims(Claim.RESALE_CONTACT_READ)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Buscar contato de revenda por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ResaleContactWireSwaggerDto,
  })
  public async findOne(@Param() params: Params): Promise<ResaleContactWireDto> {
    const dto = await this.findResaleContactById.execute(params.id);
    return mapResaleContactDtoWire(dto);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.RESALE_CONTACT_WRITE)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Ativar contato de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateResaleContact.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.RESALE_CONTACT_WRITE)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Desativar contato de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateResaleContact.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.RESALE_CONTACT_WRITE)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Editar contato de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditResaleContactInputDto): Promise<SuccessMessage> {
    return this.editResaleContact.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.RESALE_CONTACT_WRITE)
  @Swagger({
    tags: ['Revendas - Contatos'],
    summary: 'Deletar contato de revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteResaleContact.execute(params.id);
  }
}
