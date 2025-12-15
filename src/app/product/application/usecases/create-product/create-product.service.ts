import { Injectable } from '@nestjs/common';
import { CreateProductInputDto, CreateProductOutputDto } from './dtos/create-product.dto';

@Injectable()
export class CreateProduct {
  constructor() {}

  public async execute(data: CreateProductInputDto): Promise<CreateProductOutputDto> {
    // Lógica para criar um product.
  }
}
