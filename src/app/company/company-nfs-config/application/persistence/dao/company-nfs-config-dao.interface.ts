import { CompanyNfsConfigDto } from '../../dtos/company-nfs-config.dto';
import { CreateCompanyNfsConfigInputDto } from '../../usecases/create-company-nfs-config/dtos/create-company-nfs-config.dto';
import { EditCompanyNfsConfigInputDto } from '../../usecases/edit-company-nfs-config/dtos/edit-company-nfs-config.dto';

export interface ICompanyNfsConfigDao {
  findById(id: number): Promise<CompanyNfsConfigDto | null>;
  findByCompanyId(companyId: number): Promise<CompanyNfsConfigDto | null>;
  /** Todas as configurações de prestador. Usado pelo healthcheck de certificados. */
  findAll(): Promise<CompanyNfsConfigDto[]>;
  save(data: CreateCompanyNfsConfigInputDto): Promise<number>;
  edit(id: number, data: EditCompanyNfsConfigInputDto): Promise<void>;
}
