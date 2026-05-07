import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CheckClientDocumentInUseInputDto {
  @ApiProperty({ example: '09.748.165/0001-10' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  document: string;
}

export class CheckClientDocumentInUseOutputDto {
  @ApiProperty({
    example: true,
    description: '`true` quando já existe cliente com o documento normalizado.',
  })
  documentInUse: boolean;
}
