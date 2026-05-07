import { ResaleContactDto } from 'src/app/resale/resale-contact/application/dtos/resale-contact.dto';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import type {
  CreateResaleExecuteInputDto,
  CreateResaleInputDto,
  CreateResaleOutputDto,
} from 'src/app/resale/resale/application/usecases/create-resale/dtos/create-resale.dto';
import { GetResaleSequenceOutputDto } from 'src/app/resale/resale/application/usecases/get-resale-sequence/dtos/get-resale-sequence.dto';
import { HexadecimalDecimal } from 'src/shared/value-objects/hexadecimal-decimal/hexadecimal-decimal.vo';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

export type ResaleWireDto = Omit<ResaleDto, 'id'> & { id: string };

export type CreateResaleOutputWireDto = { id: string };

export type GetResaleSequenceWireDto = { nextId: string };

export type ResaleContactWireDto = Omit<ResaleContactDto, 'resaleId'> & { resaleId: string };

export function mapCreateResaleInputToExecuteInput(body: CreateResaleInputDto): CreateResaleExecuteInputDto {
  return {
    ...body,
    id:
      body.id != null && String(body.id).trim() !== ''
        ? parseResaleHexToDecimal(body.id)
        : undefined,
  };
}

export function parseResaleHexToDecimal(hex: string): number {
  return HexadecimalDecimal.fromHex(hex).decimal;
}

export function decimalToResaleHex(decimal: number): string {
  return HexadecimalDecimal.fromDecimal(decimal).hex;
}

export function mapResaleDtoWire(dto: ResaleDto): ResaleWireDto {
  return {
    ...dto,
    id: decimalToResaleHex(dto.id),
  };
}

export function mapCreateResaleOutputWire(dto: CreateResaleOutputDto): CreateResaleOutputWireDto {
  return {
    id: decimalToResaleHex(dto.id),
  };
}

export function mapPaginationResaleWire(page: IPagination<ResaleDto>): IPagination<ResaleWireDto> {
  return {
    ...page,
    data: page.data.map(mapResaleDtoWire),
  };
}

export function mapGetResaleSequenceOutputWire(dto: GetResaleSequenceOutputDto): GetResaleSequenceWireDto {
  return {
    nextId: decimalToResaleHex(dto.nextId),
  };
}

export function mapResaleContactDtoWire(dto: ResaleContactDto): ResaleContactWireDto {
  return {
    ...dto,
    resaleId: decimalToResaleHex(dto.resaleId),
  };
}

export function mapPaginationResaleContactWire(
  page: IPagination<ResaleContactDto>,
): IPagination<ResaleContactWireDto> {
  return {
    ...page,
    data: page.data.map(mapResaleContactDtoWire),
  };
}
