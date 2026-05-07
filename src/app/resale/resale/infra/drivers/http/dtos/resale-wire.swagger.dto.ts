import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Contrato OpenAPI: mesmo shape que ResaleDto, com `id` em hexadecimal na wire. */
export class ResaleWireSwaggerDto {
  @ApiProperty({ example: '43', description: 'ID da revenda em hexadecimal.' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  identifier: string | null;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  street: string;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  licenseType: string;

  @ApiProperty()
  document: string;

  @ApiPropertyOptional({ nullable: true })
  ie: string | null;

  @ApiProperty()
  phone01: string;

  @ApiPropertyOptional({ nullable: true })
  phone02: string | null;

  @ApiPropertyOptional({ nullable: true })
  voucher: string | null;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  website: string | null;

  @ApiPropertyOptional({ nullable: true })
  nickname: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validityDate: Date | null;

  @ApiPropertyOptional({ nullable: true })
  accessEmail: string | null;

  @ApiPropertyOptional({ nullable: true })
  accessPassword: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentDay: number | null;

  @ApiPropertyOptional({ nullable: true })
  bonus: number | null;

  @ApiPropertyOptional({ nullable: true })
  billingStartDay: number | null;

  @ApiProperty()
  receivesSupportEmail: boolean;

  @ApiProperty()
  servedByRoot: boolean;

  @ApiProperty()
  manufacturerResale: boolean;

  @ApiProperty()
  indicatorResale: boolean;

  @ApiProperty()
  recurringResale: boolean;

  @ApiPropertyOptional({ nullable: true })
  profilePictureUrl: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CreateResaleOutputWireSwaggerDto {
  @ApiProperty({ example: '43' })
  id: string;
}

export class GetResaleSequenceWireSwaggerDto {
  @ApiProperty({ example: '43' })
  nextId: string;
}
