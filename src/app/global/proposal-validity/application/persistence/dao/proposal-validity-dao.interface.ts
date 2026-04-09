import { ProposalValidityDto } from '../../dtos/proposal-validity.dto';
import { CreateProposalValidityInputDto } from '../../usecases/create-proposal-validity/dtos/create-proposal-validity.dto';
import { EditProposalValidityInputDto } from '../../usecases/edit-proposal-validity/dtos/edit-proposal-validity.dto';
import { FindAllProposalValidityQueryDto } from '../../usecases/find-all-proposal-validity/dtos/find-all-proposal-validity.dto';

export interface IProposalValidityDao {
  findAll(queries: FindAllProposalValidityQueryDto): Promise<[ProposalValidityDto[], number]>;
  findById(id: number): Promise<ProposalValidityDto | null>;
  findByName(name: string): Promise<ProposalValidityDto | null>;
  save(data: CreateProposalValidityInputDto): Promise<number>;
  edit(id: number, data: EditProposalValidityInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByProposalValidityId(proposalValidityId: number): Promise<number>;
}
