import { AdminDetailFromDao, AdminListDto } from '../../dtos/admin.dto';
import { FindAllAdminQueryDto } from '../../usecases/find-all-admin/dtos/find-all-admin.dto';

export interface IAdminDao {
  findAll(queries: FindAllAdminQueryDto): Promise<[AdminListDto[], number]>;
  findById(id: number): Promise<AdminListDto | null>;
  findByIdWithClaims(id: number): Promise<AdminDetailFromDao | null>;
  findByDocument(document: string): Promise<{ id: number } | null>;
  findByEmail(email: string): Promise<{ id: number } | null>;
}
