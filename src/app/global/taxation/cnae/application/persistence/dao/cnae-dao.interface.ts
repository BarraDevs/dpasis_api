import { CnaeDto } from '../../dtos/cnae.dto';
import { CreateCnaeInputDto } from '../../usecases/create-cnae/dtos/create-cnae.dto';
import { EditCnaeInputDto } from '../../usecases/edit-cnae/dtos/edit-cnae.dto';
import { FindAllCnaeQueryDto } from '../../usecases/find-all-cnae/dtos/find-all-cnae.dto';

export interface ICnaeDao {
  findAll(queries: FindAllCnaeQueryDto): Promise<[CnaeDto[], number]>;
  findById(id: number): Promise<CnaeDto | null>;
  findByCode(code: string): Promise<CnaeDto | null>;
  save(data: CreateCnaeInputDto): Promise<number>;
  edit(id: number, data: EditCnaeInputDto): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  delete(id: number): Promise<void>;
  countCnaeNbsIndopByCnaeId(cnaeId: number): Promise<number>;
}
