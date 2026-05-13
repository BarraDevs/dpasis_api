import { PartialType } from '@nestjs/swagger';
import { CreateHonorificInputDto } from '../../create-honorific/dtos/create-honorific.dto';

export class EditHonorificInputDto extends PartialType(CreateHonorificInputDto) {}
