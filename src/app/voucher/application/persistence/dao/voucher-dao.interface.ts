export class ResaleIdentifierDto {
  id: number;
  identifier: string | null;
}

export class ResaleVoucherDto {
  id: number;
  voucher: string;
}

export interface IVoucherDao {
  findIndicatorResales(): Promise<ResaleIdentifierDto[]>;
  updateVouchers(updates: ResaleVoucherDto[]): Promise<void>;
}
