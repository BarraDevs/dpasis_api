import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ActivateResale } from 'src/app/resale/resale/application/usecases/activate-resale/activate-resale.service';
import { CreateResale } from 'src/app/resale/resale/application/usecases/create-resale/create-resale.service';
import { CreateResaleInputDto } from 'src/app/resale/resale/application/usecases/create-resale/dtos/create-resale.dto';
import { DeactivateResale } from 'src/app/resale/resale/application/usecases/deactivate-resale/deactivate-resale.service';
import { EditResaleInputDto } from 'src/app/resale/resale/application/usecases/edit-resale/dtos/edit-resale.dto';
import { EditResale } from 'src/app/resale/resale/application/usecases/edit-resale/edit-resale.service';
import { FindAllResaleQueryDto } from 'src/app/resale/resale/application/usecases/find-all-resale/dtos/find-all-resale.dto';
import { FindAllResale } from 'src/app/resale/resale/application/usecases/find-all-resale/find-all-resale.service';
import { FindResaleById } from 'src/app/resale/resale/application/usecases/find-resale-by-id/find-resale-by-id.service';
import { GetResaleSequence } from 'src/app/resale/resale/application/usecases/get-resale-sequence/get-resale-sequence.service';
import { SetResaleNextIdInputDto } from 'src/app/resale/resale/application/usecases/set-resale-next-id/dtos/set-resale-next-id.dto';
import { SetResaleNextId } from 'src/app/resale/resale/application/usecases/set-resale-next-id/set-resale-next-id.service';
import {
  CreateResaleOutputWireDto,
  GetResaleSequenceWireDto,
  mapCreateResaleInputToExecuteInput,
  mapCreateResaleOutputWire,
  mapGetResaleSequenceOutputWire,
  mapPaginationResaleWire,
  mapResaleDtoWire,
  parseResaleHexToDecimal,
  ResaleWireDto,
} from 'src/app/resale/resale/infra/drivers/http/resale-id-http.codec';
import {
  CreateResaleOutputWireSwaggerDto,
  GetResaleSequenceWireSwaggerDto,
  ResaleWireSwaggerDto,
} from 'src/app/resale/resale/infra/drivers/http/dtos/resale-wire.swagger.dto';
import { UploadSingleInputDto } from 'src/app/upload-file/application/usecases/upload-single/dtos/upload-single.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { ParamsHexId } from 'src/infra/validators/class/dtos/params/params-hex-id.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/resale')
@RequiredRoles(AccountRole.ADMIN)
export class ResaleAdminController {
  constructor(
    private readonly activateResale: ActivateResale,
    private readonly createResale: CreateResale,
    private readonly deactivateResale: DeactivateResale,
    private readonly findAllResale: FindAllResale,
    private readonly findResaleById: FindResaleById,
    private readonly editResale: EditResale,
    private readonly getResaleSequence: GetResaleSequence,
    private readonly setResaleNextId: SetResaleNextId,
  ) {}

  @Post()
  @RequiredClaims(Claim.RESALE_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Revendas'],
    summary: 'Criar nova revenda',
    applyBadRequest: true,
    mergeRequestBody: [CreateResaleInputDto, UploadSingleInputDto],
    createdResponse: CreateResaleOutputWireSwaggerDto,
  })
  public async create(
    @Body() body: CreateResaleInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateResaleOutputWireDto> {
    const result = await this.createResale.execute(mapCreateResaleInputToExecuteInput(body), file);
    return mapCreateResaleOutputWire(result);
  }

  @Get()
  @RequiredClaims(Claim.RESALE_READ)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Listar revendas com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ResaleWireSwaggerDto,
  })
  public async findAll(@Query() queries: FindAllResaleQueryDto): Promise<IPagination<ResaleWireDto>> {
    const page = await this.findAllResale.execute(queries);
    return mapPaginationResaleWire(page);
  }

  @Get('sequence')
  @RequiredClaims(Claim.RESALE_READ)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Consultar próximo ID automático de revenda',
    okResponse: GetResaleSequenceWireSwaggerDto,
  })
  public async getSequence(): Promise<GetResaleSequenceWireDto> {
    const dto = await this.getResaleSequence.execute();
    return mapGetResaleSequenceOutputWire(dto);
  }

  @Patch('sequence')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Definir próximo ID automático de revenda',
    applyBadRequest: true,
    okResponse: SuccessMessage,
  })
  public setSequence(@Body() body: SetResaleNextIdInputDto): Promise<SuccessMessage> {
    return this.setResaleNextId.execute({
      nextId: parseResaleHexToDecimal(body.nextId),
    });
  }

  @Get(':id')
  @RequiredClaims(Claim.RESALE_READ)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Buscar revenda por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ResaleWireSwaggerDto,
  })
  public async findOne(@Param() params: ParamsHexId): Promise<ResaleWireDto> {
    const dto = await this.findResaleById.execute(parseResaleHexToDecimal(params.id));
    return mapResaleDtoWire(dto);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Ativar revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: ParamsHexId): Promise<SuccessMessage> {
    return this.activateResale.execute(parseResaleHexToDecimal(params.id));
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Desativar revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: ParamsHexId): Promise<SuccessMessage> {
    return this.deactivateResale.execute(parseResaleHexToDecimal(params.id));
  }

  @Patch(':id')
  @RequiredClaims(Claim.RESALE_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Revendas'],
    summary: 'Editar revenda',
    applyBadRequest: true,
    applyNotFound: true,
    mergeRequestBody: [EditResaleInputDto, UploadSingleInputDto],
    okResponse: SuccessMessage,
  })
  public update(
    @Param() params: ParamsHexId,
    @Body() body: EditResaleInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SuccessMessage> {
    return this.editResale.execute(parseResaleHexToDecimal(params.id), body, file);
  }
}
