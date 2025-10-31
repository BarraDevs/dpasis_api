import { SupplierDto } from '../../dtos/supplier.dto';
import { FindAllSupplierQueryDto } from '../../usecases/find-all-supplier/dtos/find-all-supplier.dto';

export interface ISupplierDao {
  findAll(queries: FindAllSupplierQueryDto): Promise<[SupplierDto[], number]>;
  findById(id: string): Promise<SupplierDto | null>;
  findByCnpj(cnpj: string): Promise<SupplierDto | null>;
  findByIe(ie: string): Promise<SupplierDto | null>;
}
