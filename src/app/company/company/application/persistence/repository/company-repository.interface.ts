import { Company } from 'src/app/company/company/domain/entities/company.entity';

export interface ICompanyRepository {
  save(entity: Company): Promise<number>;
  edit(entity: Company): Promise<void>;
  findById(id: number): Promise<Company | null>;
}
