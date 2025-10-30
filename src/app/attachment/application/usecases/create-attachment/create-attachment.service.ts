import { Injectable } from '@nestjs/common';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from './dtos/create-attachment.dto';

@Injectable()
export class CreateAttachment {
  constructor() {}

  public async execute(data: CreateAttachmentInputDto): Promise<CreateAttachmentOutputDto> {
    // Lógica para criar um attachment.
  }
}
