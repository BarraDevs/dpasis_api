import { Admin } from 'src/app/admin/domain/entities/admin.entity';

export interface IAdminRepository {
  save(entity: Admin, passwordHash: string): Promise<number>;
  edit(entity: Admin): Promise<void>;
  findById(id: number): Promise<Admin | null>;
}
