import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Params } from 'src/infra/validators/class/dtos/params';
import { Swagger } from 'src/infra/openapi/swagger';
import { NfseDto } from '../../../../application/dtos/nfse.dto';
import { FindNfseById } from '../../../../application/usecases/find-nfse-by-id/find-nfse-by-id.service';
import { IssueNfseInputDto, IssueNfseOutputDto } from '../../../../application/usecases/issue-nfse/dtos/issue-nfse.dto';
import { IssueNfse } from '../../../../application/usecases/issue-nfse/issue-nfse.service';

@Controller('admin/nfse')
export class NfseAdminController {
  constructor(
    private readonly issueNfseService: IssueNfse,
    private readonly findNfseByIdService: FindNfseById,
  ) {}

  @Post()
  @Swagger({
    tags: ['NFSe'],
    summary: 'Emitir NFS-e (assíncrono, via Giss Online)',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    createdResponse: IssueNfseOutputDto,
  })
  public issue(@Body() body: IssueNfseInputDto): Promise<IssueNfseOutputDto> {
    return this.issueNfseService.execute(body);
  }

  @Get(':id')
  @Swagger({
    tags: ['NFSe'],
    summary: 'Buscar NFS-e por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: NfseDto,
  })
  public findOne(@Param() params: Params): Promise<NfseDto> {
    return this.findNfseByIdService.execute(params.id);
  }
}
