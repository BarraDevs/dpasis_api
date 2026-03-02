import { PartialType } from '@nestjs/swagger';
import { CreateClientInputDto } from '../../create-client/dtos/create-client.dto';

export class EditClientInputDto extends PartialType(CreateClientInputDto) {}
