import { NbsDto } from '../../dtos/nbs.dto';
import { CreateNbsInputDto } from '../../usecases/create-nbs/dtos/create-nbs.dto';
import { EditNbsInputDto } from '../../usecases/edit-nbs/dtos/edit-nbs.dto';
import { FindAllNbsQueryDto } from '../../usecases/find-all-nbs/dtos/find-all-nbs.dto';

export interface INbsDao {
  findAll(queries: FindAllNbsQueryDto): Promise<[NbsDto[], number]>;
  findById(id: number): Promise<NbsDto | null>;
  findByCode(code: string): Promise<NbsDto | null>;
  save(data: CreateNbsInputDto): Promise<number>;
  edit(id: number, data: EditNbsInputDto): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
