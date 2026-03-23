import { ServiceProposalValidityDto } from '../../dtos/service-proposal-validity.dto';
import { CreateServiceProposalValidityInputDto } from '../../usecases/create-service-proposal-validity/dtos/create-service-proposal-validity.dto';
import { EditServiceProposalValidityInputDto } from '../../usecases/edit-service-proposal-validity/dtos/edit-service-proposal-validity.dto';
import { FindAllServiceProposalValidityQueryDto } from '../../usecases/find-all-service-proposal-validity/dtos/find-all-service-proposal-validity.dto';

export interface IServiceProposalValidityDao {
  findAll(queries: FindAllServiceProposalValidityQueryDto): Promise<[ServiceProposalValidityDto[], number]>;
  findById(id: number): Promise<ServiceProposalValidityDto | null>;
  findByName(name: string): Promise<ServiceProposalValidityDto | null>;
  save(data: CreateServiceProposalValidityInputDto): Promise<number>;
  edit(id: number, data: EditServiceProposalValidityInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByProposalValidityId(proposalValidityId: number): Promise<number>;
}
