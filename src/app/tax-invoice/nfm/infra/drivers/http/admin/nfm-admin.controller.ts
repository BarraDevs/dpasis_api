import { Controller, Get, Post, Query } from '@nestjs/common';
import { NfmDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindAllNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-all-nfms/find-all-nfms.service';
import { FindAllNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-all-nfms/dtos/find-all-nfms.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { NfsNoteDto } from 'src/infra/nfs-generation/dtos/find-nfs-servico-prestado.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('admin/nfm')
export class NfmAdminController {
  constructor(
    private readonly findAllNfms: FindAllNfms,
    private readonly findElegibleClients: FindElegibleClients,
    private readonly saveElegibleNfmsService: SaveElegibleNfms,
  ) {}

  @Get()
  @Swagger({
    tags: ['NFM'],
    summary: 'Listar clientes elegíveis para emissão de NF-e',
    applyBadRequest: true,
    okResponse: NfmDto,
  })
  public findNfms(): Promise<NfmDto[]> {
    return this.findElegibleClients.execute();
  }

  @Get('invoices')
  @Swagger({
    tags: ['NFM'],
    summary: 'Listar NFS-e de serviço prestado no Giss Online',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: [NfsNoteDto],
  })
  public findAllInvoices(@Query() queries: FindAllNfmsQueryDto): Promise<NfsNoteDto[]> {
    return this.findAllNfms.execute(queries);
  }

  @Post()
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
