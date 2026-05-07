import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsUnsigned32HexString } from 'src/infra/validators/class/decorators/unsigned-32-hex-string/is-unsigned-32-hex-string';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class SetResaleNextIdInputDto {
  @ApiProperty({
    example: '43',
    description: 'Próximo ID automático em hexadecimal (1 a 8 caracteres 0-9/A-F; opcional prefixo 0x).',
  })
  @Trim()
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @IsUnsigned32HexString()
  nextId: string;
}

export type SetResaleNextIdExecuteInputDto = { nextId: number };
