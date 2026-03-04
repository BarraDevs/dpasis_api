import { CnaeNbsIndopDto } from 'src/app/cnae-nbs-indop/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';

export class ClientItemDto {
  id: number;
  clientId: number;
  description: string;
  quantity: number;
  unitValueInCents: number;
  totalValueInCents: number;
  cnaeNbsIndop: CnaeNbsIndopDto;
  createdAt: Date;
  updatedAt: Date;
}
