import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { NfmDto, NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { CancelNfm } from 'src/app/tax-invoice/nfm/application/usecases/cancel-nfm/cancel-nfm.service';
import { CancelNfmInputDto, CancelNfmOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/cancel-nfm/dtos/cancel-nfm.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { FindGeneratedNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/find-generated-nfms.service';
import { FindGeneratedNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import { FindNfmById } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { FindNfmProviderStatus } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-provider-status/find-nfm-provider-status.service';
import { FindNfmProviderStatusOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-provider-status/dtos/find-nfm-provider-status.dto';
import { ReconcileNfm } from 'src/app/tax-invoice/nfm/application/usecases/reconcile-nfm/reconcile-nfm.service';
import { ReconcileNfmInputDto, ReconcileNfmOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/reconcile-nfm/dtos/reconcile-nfm.dto';
import { ReissueNfm } from 'src/app/tax-invoice/nfm/application/usecases/reissue-nfm/reissue-nfm.service';
import { ReissueNfmInputDto, ReissueNfmOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/reissue-nfm/dtos/reissue-nfm.dto';
import { ReconcileNfsePeriod } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse-period/reconcile-nfse-period.service';
import {
  ReconcileNfsePeriodInputDto,
  ReconcileNfsePeriodOutputDto,
} from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse-period/dtos/reconcile-nfse-period.dto';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { getThrottleHalfLimit } from 'src/infra/throttle/throttle.runtime';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/nfm')
@RequiredRoles(AccountRole.ADMIN)
export class NfmAdminController {
  constructor(
    private readonly findGeneratedNfms: FindGeneratedNfms,
    private readonly findElegibleClients: FindElegibleClients,
    private readonly findNfmById: FindNfmById,
    private readonly saveElegibleNfms: SaveElegibleNfms,
    private readonly cancelNfm: CancelNfm,
    private readonly findNfmProviderStatus: FindNfmProviderStatus,
    private readonly reconcileNfm: ReconcileNfm,
    private readonly reissueNfm: ReissueNfm,
    private readonly reconcileNfsePeriod: ReconcileNfsePeriod,
  ) {}

  @Get()
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFM'],
    summary: 'Listar NFMs com NFS-e vinculada',
    applyBadRequest: true,
    okPaginatedResponse: NfmWithNfseDto,
  })
  public findAll(@Query() queries: FindGeneratedNfmsQueryDto): Promise<IPagination<NfmWithNfseDto>> {
    return this.findGeneratedNfms.execute(queries);
  }

  @Get('elegible')
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFM'],
    summary: 'Listar NFMs elegíveis para emissão de NFS-e',
    applyBadRequest: true,
    okResponse: NfmDto,
  })
  public findElegible(): Promise<NfmDto[]> {
    return this.findElegibleClients.execute();
  }

  @Post()
  @RequiredClaims(Claim.NFM_WRITE)
  @Swagger({
    tags: ['NFM'],
    summary: 'Salvar NFMs elegíveis no banco de dados',
    applyBadRequest: true,
    createdResponse: SaveElegibleNfmsOutputDto,
  })
  public saveElegible(): Promise<SaveElegibleNfmsOutputDto> {
    return this.saveElegibleNfms.execute();
  }

  @Post(':id/cancel')
  @RequiredClaims(Claim.NFM_WRITE)
  @Swagger({
    tags: ['NFM'],
    summary: 'Cancelar NFS-e vinculada à NFM (síncrono, via Giss Online)',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: CancelNfmOutputDto,
  })
  public cancel(@Param() params: Params, @Body() body: CancelNfmInputDto): Promise<CancelNfmOutputDto> {
    return this.cancelNfm.execute(params.id, body);
  }

  @Post('reconcile-period')
  @RequiredClaims(Claim.NFM_WRITE)
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['NFM'],
    summary: 'Conciliar NFS-e de um período contra o provedor (dryRun por padrão)',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: ReconcileNfsePeriodOutputDto,
  })
  public reconcilePeriod(@Body() body: ReconcileNfsePeriodInputDto): Promise<ReconcileNfsePeriodOutputDto> {
    return this.reconcileNfsePeriod.execute(body);
  }

  @Get(':id/provider-status')
  @Throttle({
    default: { limit: () => getThrottleHalfLimit() },
  })
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFM'],
    summary: 'Consultar no provedor o RPS desta NFM (somente leitura)',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: FindNfmProviderStatusOutputDto,
  })
  public providerStatus(@Param() params: Params): Promise<FindNfmProviderStatusOutputDto> {
    return this.findNfmProviderStatus.execute(params.id);
  }

  @Post(':id/reconcile')
  @RequiredClaims(Claim.NFM_WRITE)
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['NFM'],
    summary: 'Reconciliar a NFS-e desta NFM com o provedor',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: ReconcileNfmOutputDto,
  })
  public reconcile(@Param() params: Params, @Body() body: ReconcileNfmInputDto): Promise<ReconcileNfmOutputDto> {
    return this.reconcileNfm.execute(params.id, body);
  }

  @Post(':id/reissue')
  @RequiredClaims(Claim.NFM_WRITE)
  @HttpCode(HttpStatus.ACCEPTED)
  @Swagger({
    tags: ['NFM'],
    summary: 'Reenviar o RPS desta NFM, reaproveitando a numeração já reservada',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    applyServiceUnavailable: true,
    okResponse: ReissueNfmOutputDto,
  })
  public reissue(@Param() params: Params, @Body() body: ReissueNfmInputDto): Promise<ReissueNfmOutputDto> {
    return this.reissueNfm.execute(params.id, body);
  }

  @Get(':id')
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFM'],
    summary: 'Buscar NFM por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: NfmWithNfseDto,
  })
  public findOne(@Param() params: Params): Promise<NfmWithNfseDto> {
    return this.findNfmById.execute(params.id);
  }
}
