import { IndopDto } from '../../dtos/indop.dto';
import { CreateIndopInputDto } from '../../usecases/create-indop/dtos/create-indop.dto';
import { EditIndopInputDto } from '../../usecases/edit-indop/dtos/edit-indop.dto';
import { FindAllIndopQueryDto } from '../../usecases/find-all-indop/dtos/find-all-indop.dto';

export interface IIndopDao {
  findAll(queries: FindAllIndopQueryDto): Promise<[IndopDto[], number]>;
  findById(id: number): Promise<IndopDto | null>;
  findByCode(code: string): Promise<IndopDto | null>;
  save(data: CreateIndopInputDto): Promise<number>;
  edit(id: number, data: EditIndopInputDto): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  delete(id: number): Promise<void>;
  countCnaeNbsIndopByIndopId(indopId: number): Promise<number>;
}
