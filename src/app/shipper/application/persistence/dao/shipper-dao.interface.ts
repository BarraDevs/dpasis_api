import { ShipperDto } from '../../dtos/shipper.dto';
import { CreateShipperInputDto } from '../../usecases/create-shipper/dtos/create-shipper.dto';
import { EditShipperInputDto } from '../../usecases/edit-shipper/dtos/edit-shipper.dto';
import { FindAllShipperQueryDto } from '../../usecases/find-all-shipper/dtos/find-all-shipper.dto';

export interface IShipperDao {
  findAll(queries: FindAllShipperQueryDto): Promise<[ShipperDto[], number]>;
  findById(id: string): Promise<ShipperDto | null>;
  findByCnpj(cnpj: string): Promise<ShipperDto | null>;
  save(data: CreateShipperInputDto): Promise<string>;
  edit(id: string, data: EditShipperInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
