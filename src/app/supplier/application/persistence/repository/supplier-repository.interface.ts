import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';

export interface ISupplierRepository {
  save(supplier: Supplier): Promise<void>;
  edit(supplier: Supplier): Promise<void>;
}
