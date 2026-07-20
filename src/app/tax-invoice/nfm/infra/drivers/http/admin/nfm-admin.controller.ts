import { Controller, Get, Post, Query } from '@nestjs/common';
import { NfmDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindAllNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-all-nfms/find-all-nfms.service';
import { FindAllNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-all-nfms/dtos/find-all-nfms.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { NfDto } from 'src/infra/nf-generation/dtos/nf.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('admin/nfm')
export class NfmAdminController {
  constructor(
    private readonly findAllNfms: FindAllNfms,
    private readonly findElegibleClients: FindElegibleClients,
    private readonly saveElegibleNfmsService: SaveElegibleNfms,
    // private readonly createNfmService: CreateNfm,
    // private readonly findAllNfmService: FindAllNfm,
    // private readonly findNfmByIdService: FindNfmById,
    // private readonly editNfmService: EditNfm,
    // private readonly deleteNfmService: DeleteNfm,
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
    summary: 'Listar notas fiscais emitidas (NFeMail)',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: [NfDto],
  })
  public findAllInvoices(@Query() queries: FindAllNfmsQueryDto): Promise<NfDto[]> {
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

  // @Post()
  // @Swagger({
  //   tags: ['TAG_AQUI'],
  //   summary: 'Rota para criar NOME_AQUI',
  //   applyBadRequest: true,
  //   createdResponse: CreateNfmOutputDto,
  // })
  // public create(@Body() body: CreateNfmInputDto): Promise<CreateNfmOutputDto> {
  //   return this.createNfmService.execute(body);
  // }

//  @Get()
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para listar NOME_AQUI',
//    applyBadRequest: true,
//    okPaginatedResponse: NfmDto,
//  })
//  public findAll(@Query() queries: FindAllNfmQueryDto): Promise<IPagination<NfmDto>> {
//    return this.findAllNfmService.execute(queries);
//  }
//
//  @Get(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para buscar NOME_AQUI por ID',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: NfmDto,
//  })
//  public findOne(@Param() params: Params): Promise<NfmDto> {
//    return this.findNfmByIdService.execute(params.id);
//  }
//
//  @Patch(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para editar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public update(@Param() params: Params, @Body() body: EditNfmInputDto): Promise<SuccessMessage> {
//    return this.editNfmService.execute(params.id, body);
//  }
//
//  @Delete(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para deletar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public remove(@Param() params: Params): Promise<SuccessMessage> {
//    return this.deleteNfmService.execute(params.id);
//  }
}
