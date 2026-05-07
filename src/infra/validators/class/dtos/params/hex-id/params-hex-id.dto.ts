import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsUnsigned32HexString } from '../../../decorators/unsigned-32-hex-string/is-unsigned-32-hex-string';
import { Trim } from '../../../decorators/trim/trim';

export class ParamsHexId {
  @ApiProperty({
    example: '43',
    description: 'Identificador em hexadecimal (1 a 8 caracteres 0-9/A-F; opcional prefixo 0x).',
  })
  @Trim()
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsString({ message: '$property deve ser uma string' })
  @IsUnsigned32HexString()
  id: string;
}
