import { Company } from 'src/app/company/domain/entities/company.entity';

export interface ICompanyRepository {
  save(company: Company): Promise<void>;
  edit(company: Company): Promise<void>;
}
