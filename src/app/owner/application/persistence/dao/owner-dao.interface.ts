import { OwnerDto } from '../../dtos/owner.dto';

export interface IOwnerDao {
  findById(id: string): Promise<OwnerDto | null>;
}
