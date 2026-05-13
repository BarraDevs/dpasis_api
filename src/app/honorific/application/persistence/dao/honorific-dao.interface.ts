import { HonorificDto } from '../../dtos/honorific.dto';
import { CreateHonorificInputDto } from '../../usecases/create-honorific/dtos/create-honorific.dto';
import { EditHonorificInputDto } from '../../usecases/edit-honorific/dtos/edit-honorific.dto';
import { FindAllHonorificQueryDto } from '../../usecases/find-all-honorific/dtos/find-all-honorific.dto';

export interface IHonorificDao {
  findAll(queries: FindAllHonorificQueryDto): Promise<[HonorificDto[], number]>;
  findById(id: number): Promise<HonorificDto | null>;
  findByName(name: string): Promise<HonorificDto | null>;
  save(data: CreateHonorificInputDto): Promise<number>;
  edit(id: number, data: EditHonorificInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
