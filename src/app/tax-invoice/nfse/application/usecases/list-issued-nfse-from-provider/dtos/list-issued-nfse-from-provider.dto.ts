import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Matches } from 'class-validator';
import { LIST_ISSUED_NFS_PAGE_SIZE, NfsIssuedNoteListingDto } from 'src/infra/nfs-generation/dtos/list-issued-nfs.dto';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ListIssuedNfseFromProviderQueryDto {
  @ApiProperty({ example: 1, description: 'Empresa prestadora cuja NFS-e o Giss deve listar.' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  companyId: number;

  /** `yyyy-MM-dd`, fuso `America/Sao_Paulo`. Inclusivo nos dois extremos, como o provedor. */
  @ApiProperty({ example: '2026-09-03' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Matches(ISO_DATE, { message: '$property deve estar no formato yyyy-MM-dd' })
  @Trim()
  startDate: string;

  @ApiProperty({ example: '2026-09-03' })
  @IsString({ message: '$property deve ser um texto' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Matches(ISO_DATE, { message: '$property deve estar no formato yyyy-MM-dd' })
  @Trim()
  endDate: string;

  /** Página do Giss, começando em 1. Cada página tem no máximo 50 notas. */
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;
}

@ApiExtraModels(NfsIssuedNoteListingDto)
export class ListIssuedNfseFromProviderOutputDto {
  @ApiProperty({ example: 1 })
  companyId: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: LIST_ISSUED_NFS_PAGE_SIZE, description: 'Tamanho fixo da página no Giss.' })
  pageSize: number;

  @ApiProperty({
    example: true,
    description: 'true quando a página veio incompleta ou o Giss respondeu E212 (fim da paginação).',
  })
  endOfPages: boolean;

  @ApiProperty({ type: [NfsIssuedNoteListingDto] })
  notes: NfsIssuedNoteListingDto[];
}
