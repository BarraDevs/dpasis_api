import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, StreamableFile } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { IssueNfOutputDto } from 'src/infra/nf-generation/dtos/issue-nf.dto';
import { NfDto } from 'src/infra/nf-generation/dtos/nf.dto';
import type { INfGenerationGateway } from 'src/infra/nf-generation/nf-generation.gateway';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/id/params.dto';
import {
  AccessKeyQueryDto,
  CancelNfTestInputDto,
  FindAllNfTestQueryDto,
  IssueNfTestInputDto,
} from './dtos/nf-generation-test.dto';

@Controller('nf-generation-test')
export class NfGenerationTestController {
  constructor(
    @Inject(TOKENS.NfGenerationGateway) private readonly nfGeneration: INfGenerationGateway,
  ) {}

  @Post('issue')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['NF Generation (Test)'],
    summary: 'Emitir nota fiscal (payload tipado com IBS/CBS)',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: IssueNfOutputDto,
  })
  public issue(@Body() body: IssueNfTestInputDto): Promise<IssueNfOutputDto> {
    return this.nfGeneration.issue(body);
  }

  @Get()
  @Swagger({
    tags: ['NF Generation (Test)'],
    summary: 'Listar notas fiscais',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: [NfDto],
  })
  public findAll(@Query() query: FindAllNfTestQueryDto): Promise<NfDto[]> {
    return this.nfGeneration.findAll(query);
  }

  @Get('by-id/:id')
  @Swagger({
    tags: ['NF Generation (Test)'],
    summary: 'Buscar nota fiscal por ID interno NFeMail',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: NfDto,
  })
  public findById(@Param() params: Params): Promise<NfDto> {
    return this.nfGeneration.findById(params.id);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['NF Generation (Test)'],
    summary: 'Cancelar nota fiscal autorizada',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: SuccessMessage,
  })
  public async cancel(@Body() body: CancelNfTestInputDto): Promise<SuccessMessage> {
    await this.nfGeneration.cancel(body);
    return { message: 'Nota fiscal cancelada com sucesso' };
  }

  @Get('danfe')
  @Swagger({
    tags: ['NF Generation (Test)'],
    summary: 'Baixar DANFe (PDF)',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
  })
  public async getDanfe(@Query() query: AccessKeyQueryDto): Promise<StreamableFile> {
    const file = await this.nfGeneration.getDanfe(query.accessKey);

    return new StreamableFile(Buffer.from(file.content, 'base64'), {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName}"`,
    });
  }

  @Get('xml')
  @Swagger({
    tags: ['NF Generation (Test)'],
    summary: 'Baixar XML da nota fiscal',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
  })
  public async getXml(@Query() query: AccessKeyQueryDto): Promise<StreamableFile> {
    const file = await this.nfGeneration.getXml(query.accessKey);

    return new StreamableFile(Buffer.from(file.content, 'utf-8'), {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName}"`,
    });
  }
}
