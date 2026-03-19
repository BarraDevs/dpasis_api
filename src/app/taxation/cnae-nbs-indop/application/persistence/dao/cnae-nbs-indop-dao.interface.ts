import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import { CreateCnaeNbsIndopInputDto } from '../../usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndopQueryDto } from '../../usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';

export interface ICnaeNbsIndopDao {
  findAll(queries: FindAllCnaeNbsIndopQueryDto): Promise<[CnaeNbsIndopDto[], number]>;
  findById(id: number): Promise<CnaeNbsIndopDto | null>;
  findByComposite(cnaeId: number, nbsId: number, indopId: number): Promise<CnaeNbsIndopDto | null>;
  save(data: CreateCnaeNbsIndopInputDto): Promise<number>;
  delete(id: number): Promise<void>;
  findDistinctCnaeIds(): Promise<number[]>;
  findDistinctNbsIdsByCnaeId(cnaeId: number): Promise<number[]>;
  findDistinctIndopIdsByCnaeIdAndNbsId(cnaeId: number, nbsId: number): Promise<number[]>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
