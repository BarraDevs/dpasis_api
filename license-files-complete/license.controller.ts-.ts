TypeScript

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LicenseDto } from 'src/app/license/application/dtos/license.dto';
import { CreateLicense } from 'src/app/license/application/usecases/create-license/create-license.service';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from 'src/app/license/application/usecases/create-license/dtos/create-license.dto';
import { DeleteLicense } from 'src/app/license/application/usecases/delete-license/delete-license.service';
import { EditLicenseInputDto } from 'src/app/license/application/usecases/edit-license/dtos/edit-license.dto';
import { EditLicense } from 'src/app/license/application/usecases/edit-license/edit-license.service';
import { FindAllLicenseQueryDto } from 'src/app/license/application/usecases/find-all-license/dtos/find-all-license.dto';
import { FindAllLicense } from 'src/app/license/application/usecases/find-all-license/find-all-license.service';
import { FindLicenseById } from 'src/app/license/application/usecases/find-license-by-id/find-license-by-id.service';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator'; // Adicionado
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum'; // Adicionado
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('license')
@RequiredRoles(AccountRole.ADMIN) // Protegendo todas as rotas de licença
export class LicenseController {
  constructor(
    private readonly createLicenseService: CreateLicense,
    private readonly findAllLicenseService: FindAllLicense,
    private readonly findLicenseByIdService: FindLicenseById,
    private readonly editLicenseService: EditLicense,
    private readonly deleteLicenseService: DeleteLicense,
  ) {}

  @Post()
  @Swagger({
    tags: ['Licenças'],
    summary: 'Rota para criar uma licença',
    applyBadRequest: true,
    createdResponse: CreateLicenseOutputDto,
  })
  public create(@Body() body: CreateLicenseInputDto): Promise<CreateLicenseOutputDto> {
    return this.createLicenseService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Licenças'],
    summary: 'Rota para listar licenças',
    applyBadRequest: true,
    okPaginatedResponse: LicenseDto,
  })
  public findAll(@Query() queries: FindAllLicenseQueryDto): Promise<IPagination<LicenseDto>> {
    return this.findAllLicenseService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Licenças'],
    summary: 'Rota para buscar uma licença por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: LicenseDto,
  })
  public findOne(@Param() params: Params): Promise<LicenseDto> {
    return this.findLicenseByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Licenças'],
    summary: 'Rota para editar uma licença',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditLicenseInputDto): Promise<SuccessMessage> {
    return this.editLicenseService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Licenças'],
    summary: 'Rota para deletar uma licença',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteLicenseService.execute(params.id);
  }
}
5. DAO (Data Access Object)
O license.dao.ts já estava usando um campo genérico field para busca. Vou ajustá-lo para que o search (definido em Queries) procure no campo license, que me parece ser o campo textual principal.
