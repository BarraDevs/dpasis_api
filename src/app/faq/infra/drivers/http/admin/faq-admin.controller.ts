import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { FaqDto } from 'src/app/faq/application/dtos/faq.dto';
import { CreateFaq } from 'src/app/faq/application/usecases/create-faq/create-faq.service';
import { CreateFaqInputDto, CreateFaqOutputDto } from 'src/app/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { DeleteFaq } from 'src/app/faq/application/usecases/delete-faq/delete-faq.service';
import { EditFaqInputDto } from 'src/app/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { EditFaq } from 'src/app/faq/application/usecases/edit-faq/edit-faq.service';
import { FindAllFaqQueryDto } from 'src/app/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { FindAllFaq } from 'src/app/faq/application/usecases/find-all-faq/find-all-faq.service';
import { FindFaqById } from 'src/app/faq/application/usecases/find-faq-by-id/find-faq-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/faq')
@RequiredRoles(AccountRole.ADMIN)
export class FaqAdminController {
  constructor(
    private readonly createFaq: CreateFaq,
    private readonly findAllFaq: FindAllFaq,
    private readonly findFaqById: FindFaqById,
    private readonly editFaq: EditFaq,
    private readonly deleteFaq: DeleteFaq,
  ) {}

  @Post()
  @Swagger({
    tags: ['FAQs'],
    summary: 'Criar nova FAQ',
    applyBadRequest: true,
    createdResponse: CreateFaqOutputDto,
  })
  public create(@Body() body: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    return this.createFaq.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['FAQs'],
    summary: 'Listar FAQs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['FAQs'],
    summary: 'Buscar FAQ por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: FaqDto,
  })
  public findOne(@Param() params: Params): Promise<FaqDto> {
    return this.findFaqById.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['FAQs'],
    summary: 'Editar FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditFaqInputDto): Promise<SuccessMessage> {
    return this.editFaq.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['FAQs'],
    summary: 'Deletar FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteFaq.execute(params.id);
  }
}
