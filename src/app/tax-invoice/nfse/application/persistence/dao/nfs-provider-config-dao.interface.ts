import { NfsProviderConfigDto } from '../../dtos/nfs-provider-config.dto';

export interface INfsProviderConfigDao {
  findByCompanyId(companyId: number): Promise<NfsProviderConfigDto | null>;
}
