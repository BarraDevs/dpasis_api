import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContactDto } from 'src/app/contact/application/dtos/contact.dto';
import { CreateContact } from 'src/app/contact/application/usecases/create-contact/create-contact.service';
import { CreateContactInputDto, CreateContactOutputDto } from 'src/app/contact/application/usecases/create-contact/dtos/create-contact.dto';
import { DeleteContact } from 'src/app/contact/application/usecases/delete-contact/delete-contact.service';
import { EditContactInputDto } from 'src/app/contact/application/usecases/edit-contact/dtos/edit-contact.dto';
import { EditContact } from 'src/app/contact/application/usecases/edit-contact/edit-contact.service';
import { FindAllContactQueryDto } from 'src/app/contact/application/usecases/find-all-contact/dtos/find-all-contact.dto';
import { FindAllContact } from 'src/app/contact/application/usecases/find-all-contact/find-all-contact.service';
import { FindContactById } from 'src/app/contact/application/usecases/find-contact-by-id/find-contact-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly createContactService: CreateContact,
    private readonly findAllContactService: FindAllContact,
    private readonly findContactByIdService: FindContactById,
    private readonly editContactService: EditContact,
    private readonly deleteContactService: DeleteContact,
  ) {}

  @Post()
  @Swagger({
    tags: ['Contatos'],
    summary: 'Rota para criar um contato',
    applyBadRequest: true,
    createdResponse: CreateContactOutputDto,
  })
  public create(@Body() body: CreateContactInputDto): Promise<CreateContactOutputDto> {
    return this.createContactService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Contatos'],
    summary: 'Rota para listar todos os contatos',
    applyBadRequest: true,
    okPaginatedResponse: ContactDto,
  })
  public findAll(@Query() queries: FindAllContactQueryDto): Promise<IPagination<ContactDto>> {
    return this.findAllContactService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Contatos'],
    summary: 'Rota para buscar um contato por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ContactDto,
  })
  public findOne(@Param() params: Params): Promise<ContactDto> {
    return this.findContactByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Contatos'],
    summary: 'Rota para editar um contato',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditContactInputDto): Promise<SuccessMessage> {
    return this.editContactService.execute(params.id, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Contatos'],
    summary: 'Rota para deletar um contato',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteContactService.execute(params.id);
  }
}
