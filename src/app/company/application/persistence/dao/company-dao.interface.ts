import { CompanyDto } from '../../dtos/company.dto';
import { CreateCompanyInputDto } from '../../usecases/create-company/dtos/create-company.dto';
import { EditCompanyInputDto } from '../../usecases/edit-company/dtos/edit-company.dto';
import { FindAllCompanyQueryDto } from '../../usecases/find-all-company/dtos/find-all-company.dto';

export interface ICompanyDao {
  findAll(queries: FindAllCompanyQueryDto): Promise<[CompanyDto[], number]>;
  findById(id: string): Promise<CompanyDto | null>;
  findByDocument(document: string): Promise<CompanyDto | null>;
  findByIe(stateRegistration: string): Promise<CompanyDto | null>;
  save(data: CreateCompanyInputDto): Promise<string>;
  edit(id: string, data: EditCompanyInputDto): Promise<void>;
}
