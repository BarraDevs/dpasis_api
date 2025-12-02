import { ShipperDto } from '../../dtos/shipper.dto';
import { FindAllShipperQueryDto } from '../../usecases/find-all-shipper/dtos/find-all-shipper.dto';

export interface IShipperDao {
  findAll(queries: FindAllShipperQueryDto): Promise<[ShipperDto[], number]>;
  findById(id: string): Promise<ShipperDto | null>;
  findByCnpj(cnpj: string): Promise<ShipperDto | null>;
}
