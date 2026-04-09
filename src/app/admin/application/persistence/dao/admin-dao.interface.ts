import { AdminDto, AdminWithClaimsDto } from '../../dtos/admin.dto';
import { FindAllAdminQueryDto } from '../../usecases/find-all-admin/dtos/find-all-admin.dto';

export interface IAdminDao {
  findAll(queries: FindAllAdminQueryDto): Promise<[AdminDto[], number]>;
  findById(id: number): Promise<AdminDto | null>;
  findByIdWithClaims(id: number): Promise<AdminWithClaimsDto | null>;
  findByDocument(document: string): Promise<{ id: number } | null>;
  findByEmail(email: string): Promise<{ id: number } | null>;
}
