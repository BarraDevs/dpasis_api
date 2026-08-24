import { Controller, Get, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { NfmDto, NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { FindGeneratedNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/find-generated-nfms.service';
import { FindGeneratedNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/nfm')
@RequiredRoles(AccountRole.ADMIN)
export class NfmAdminController {
  constructor(
    private readonly findElegibleClients: FindElegibleClients,
    private readonly findGeneratedNfms: FindGeneratedNfms,
    private readonly saveElegibleNfmsService: SaveElegibleNfms,
  ) {}

  @Get('elegible')
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFM'],
    summary: 'Listar clientes elegíveis para emissão de NFS-e',
    applyBadRequest: true,
    okResponse: NfmDto,
  })
  public findElegible(): Promise<NfmDto[]> {
    return this.findElegibleClients.execute();
  }

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

  @Post()
  @RequiredClaims(Claim.NFM_WRITE)
  @Swagger({
    tags: ['NFM'],
    summary: 'Salvar NFMs elegíveis no banco de dados',
    applyBadRequest: true,
    createdResponse: SaveElegibleNfmsOutputDto,
  })
  public saveElegibleNfms(): Promise<SaveElegibleNfmsOutputDto> {
    return this.saveElegibleNfmsService.execute();
  }
}
