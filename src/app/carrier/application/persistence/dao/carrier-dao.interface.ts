import { CarrierDto } from '../../dtos/carrier.dto';
import { FindAllCarrierQueryDto } from '../../usecases/find-all-carrier/dtos/find-all-carrier.dto';

export interface ICarrierDao {
  findAll(queries: FindAllCarrierQueryDto): Promise<[CarrierDto[], number]>;
  findById(id: number): Promise<CarrierDto | null>;
  findByDocument(document: string): Promise<CarrierDto | null>;
}
