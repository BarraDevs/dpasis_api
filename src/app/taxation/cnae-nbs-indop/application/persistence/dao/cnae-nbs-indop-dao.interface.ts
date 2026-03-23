import { CnaeDto } from 'src/app/taxation/cnae/application/dtos/cnae.dto';
import { IndopDto } from 'src/app/taxation/indop/application/dtos/indop.dto';
import { NbsDto } from 'src/app/taxation/nbs/application/dtos/nbs.dto';
import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import { CreateCnaeNbsIndopInputDto } from '../../usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndopQueryDto } from '../../usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';

export interface ICnaeNbsIndopDao {
  findAll(queries: FindAllCnaeNbsIndopQueryDto): Promise<[CnaeNbsIndopDto[], number]>;
  findById(id: number): Promise<CnaeNbsIndopDto | null>;
  findByComposite(cnaeId: number, nbsId: number, indopId: number): Promise<CnaeNbsIndopDto | null>;
  save(data: CreateCnaeNbsIndopInputDto): Promise<number>;
  delete(id: number): Promise<void>;
  countClientItemsByCnaeNbsIndopId(cnaeNbsIndopId: number): Promise<number>;
  findCnaesForSelect(): Promise<CnaeDto[]>;
  findNbssForSelectByCnaeId(cnaeId: number): Promise<NbsDto[]>;
  findIndopsForSelectByCnaeAndNbs(cnaeId: number, nbsId: number): Promise<IndopDto[]>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
