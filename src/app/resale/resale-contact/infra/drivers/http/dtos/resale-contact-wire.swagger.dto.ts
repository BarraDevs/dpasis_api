import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** OpenAPI: igual a ResaleContactDto com resaleId em hexadecimal. */
export class ResaleContactWireSwaggerDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: '43', description: 'ID da revenda em hexadecimal.' })
  resaleId: string;

  @ApiProperty()
  department: {
    id: number;
    name: string;
  };

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp: string | null;

  @ApiPropertyOptional({ nullable: true })
  observations: string | null;

  @ApiProperty()
  receiveNF: boolean;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
