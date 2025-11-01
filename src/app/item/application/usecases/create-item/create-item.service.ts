import { Injectable } from '@nestjs/common';
import { CreateItemInputDto, CreateItemOutputDto } from './dtos/create-item.dto';

@Injectable()
export class CreateItem {
  constructor() {}

  public async execute(data: CreateItemInputDto): Promise<CreateItemOutputDto> {
    // Lógica para criar um item.
  }
}
