import { LicenseDto } from '../../dtos/license.dto';
import { CreateLicenseInputDto } from '../../usecases/create-license/dtos/create-license.dto';
import { EditLicenseInputDto } from '../../usecases/edit-license/dtos/edit-license.dto';
import { FindAllLicenseQueryDto } from '../../usecases/find-all-license/dtos/find-all-license.dto';

export interface ILicenseDao {
  findAll(queries: FindAllLicenseQueryDto): Promise<[LicenseDto[], number]>;
  findById(id: string): Promise<LicenseDto | null>;
  save(data: CreateLicenseInputDto): Promise<string>;
  edit(id: string, data: EditLicenseInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
