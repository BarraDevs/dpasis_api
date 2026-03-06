import { CompanyDto } from '../../dtos/company.dto';
import { FindAllCompanyQueryDto } from '../../usecases/find-all-company/dtos/find-all-company.dto';

export interface ICompanyDao {
  findAll(queries: FindAllCompanyQueryDto): Promise<[CompanyDto[], number]>;
  findById(id: number): Promise<CompanyDto | null>;
  findByDocument(document: string): Promise<CompanyDto | null>;
}
