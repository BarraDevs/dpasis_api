import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { CreateBank } from 'src/app/global/bank/application/usecases/create-bank/create-bank.service';
import { CreateBankInputDto, CreateBankOutputDto } from 'src/app/global/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { DeleteBank } from 'src/app/global/bank/application/usecases/delete-bank/delete-bank.service';
import { EditBankInputDto } from 'src/app/global/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { EditBank } from 'src/app/global/bank/application/usecases/edit-bank/edit-bank.service';
import { FindAllBankQueryDto } from 'src/app/global/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { FindAllBank } from 'src/app/global/bank/application/usecases/find-all-bank/find-all-bank.service';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { RotateBankWebhookTokenOutputDto } from 'src/app/global/bank/application/usecases/rotate-bank-webhook-token/dtos/rotate-bank-webhook-token.dto';
import { RotateBankWebhookToken } from 'src/app/global/bank/application/usecases/rotate-bank-webhook-token/rotate-bank-webhook-token.service';
import { UpdateBankStatus } from 'src/app/global/bank/application/usecases/update-bank-status/update-bank-status.service';
import {
  UploadBankCertificateInputDto,
} from 'src/app/global/bank/application/usecases/upload-bank-certificate/dtos/upload-bank-certificate.dto';
import type { UploadBankCertificateFiles } from 'src/app/global/bank/application/usecases/upload-bank-certificate/dtos/upload-bank-certificate.dto';
import { UploadBankCertificate } from 'src/app/global/bank/application/usecases/upload-bank-certificate/upload-bank-certificate.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/bank')
@RequiredRoles(AccountRole.ADMIN)
export class BankAdminController {
  constructor(
    private readonly createBank: CreateBank,
    private readonly findAllBank: FindAllBank,
    private readonly findBankById: FindBankById,
    private readonly editBank: EditBank,
    private readonly updateBankStatus: UpdateBankStatus,
    private readonly deleteBank: DeleteBank,
    private readonly uploadBankCertificate: UploadBankCertificate,
    private readonly rotateBankWebhookToken: RotateBankWebhookToken,
  ) {}

  @Post()
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Criar novo banco',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateBankOutputDto,
  })
  public create(@Body() body: CreateBankInputDto): Promise<CreateBankOutputDto> {
    return this.createBank.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.BANK_READ)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Listar bancos com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: BankDto,
  })
  public findAll(@Query() queries: FindAllBankQueryDto): Promise<IPagination<BankDto>> {
    return this.findAllBank.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.BANK_READ)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Buscar banco por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: BankDto,
  })
  public findOne(@Param() params: Params): Promise<BankDto> {
    return this.findBankById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Inverter status ativo do banco',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateBankStatus.execute(params.id);
  }

  @Post(':id/certificate')
  @RequiredClaims(Claim.BANK_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor(
    [
      { name: 'pfx', maxCount: 1 },
      { name: 'cert', maxCount: 1 },
      { name: 'key', maxCount: 1 },
    ],
    { limits: { fileSize: 1024 * 1024 } },
  ))
  @Swagger({
    tags: ['Bancos'],
    summary: 'Enviar certificado Inter (PFX+senha ou par CRT+KEY)',
    applyBadRequest: true,
    applyNotFound: true,
    mergeRequestBody: [UploadBankCertificateInputDto],
    okResponse: SuccessMessage,
  })
  public uploadCertificate(
    @Param() params: Params,
    @Body() body: UploadBankCertificateInputDto,
    @UploadedFiles() files: UploadBankCertificateFiles,
  ): Promise<SuccessMessage> {
    return this.uploadBankCertificate.execute(params.id, files ?? {}, body);
  }

  @Post(':id/webhook-token')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Rotacionar token do webhook Inter (devolvido uma única vez)',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: RotateBankWebhookTokenOutputDto,
  })
  public rotateWebhookToken(@Param() params: Params): Promise<RotateBankWebhookTokenOutputDto> {
    return this.rotateBankWebhookToken.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Editar banco',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditBankInputDto): Promise<SuccessMessage> {
    return this.editBank.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.BANK_WRITE)
  @Swagger({
    tags: ['Bancos'],
    summary: 'Excluir banco',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteBank.execute(params.id);
  }
}
