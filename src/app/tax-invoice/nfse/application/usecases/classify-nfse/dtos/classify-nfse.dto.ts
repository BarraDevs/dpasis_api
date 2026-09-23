import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { NfseClassificationKind } from '../../../../domain/enums/nfse-classification-kind.enum';

export class ClassifyNfseItemInputDto {
  @ApiProperty({ example: 41 })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  rpsNumber: number;

  @ApiProperty({ example: 'NFSE' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(5, { message: '$property deve ter no máximo 5 caracteres' })
  @Trim()
  rpsSeries: string;

  @ApiProperty({ enum: NfseClassificationKind, example: NfseClassificationKind.NFM })
  @IsEnum(NfseClassificationKind, { message: '$property deve ser NFM ou NFS' })
  kind: NfseClassificationKind;
}

export class ClassifyNfseInputDto {
  @ApiProperty({ example: 1, description: 'Empresa prestadora das NFS-e classificadas.' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  companyId: number;

  @ApiProperty({ type: [ClassifyNfseItemInputDto], description: 'Até 200 RPS. Reclassificar é enviar de novo com outro kind.' })
  @IsArray({ message: '$property deve ser um array' })
  @ArrayMinSize(1, { message: '$property deve ter no mínimo 1 item' })
  @ArrayMaxSize(200, { message: '$property deve ter no máximo 200 itens' })
  @ValidateNested({ each: true })
  @Type(() => ClassifyNfseItemInputDto)
  items: ClassifyNfseItemInputDto[];
}

export class ClassifyNfseOutputDto extends SuccessMessage {}
