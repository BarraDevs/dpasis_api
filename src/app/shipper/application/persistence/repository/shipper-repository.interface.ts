import { Shipper } from 'src/app/shipper/domain/entities/shipper.entity';

export interface IShipperRepository {
  findById(id: string): Promise<Shipper | null>;
  save(shipper: Shipper): Promise<void>;
  edit(shipper: Shipper): Promise<void>;
}
