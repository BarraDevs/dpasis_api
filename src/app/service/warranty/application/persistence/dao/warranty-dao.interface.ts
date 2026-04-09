import { WarrantyDto } from '../../dtos/warranty.dto';
import { CreateWarrantyInputDto } from '../../usecases/create-warranty/dtos/create-warranty.dto';
import { EditWarrantyInputDto } from '../../usecases/edit-warranty/dtos/edit-warranty.dto';
import { FindAllWarrantyQueryDto } from '../../usecases/find-all-warranty/dtos/find-all-warranty.dto';

export interface IWarrantyDao {
  findAll(queries: FindAllWarrantyQueryDto): Promise<[WarrantyDto[], number]>;
  findById(id: number): Promise<WarrantyDto | null>;
  findByName(name: string): Promise<WarrantyDto | null>;
  save(data: CreateWarrantyInputDto): Promise<number>;
  edit(id: number, data: EditWarrantyInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByWarrantyId(warrantyId: number): Promise<number>;
}
