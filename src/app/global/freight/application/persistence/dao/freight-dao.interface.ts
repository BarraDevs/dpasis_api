import { FreightDto } from '../../dtos/freight.dto';
import { CreateFreightInputDto } from '../../usecases/create-freight/dtos/create-freight.dto';
import { EditFreightInputDto } from '../../usecases/edit-freight/dtos/edit-freight.dto';
import { FindAllFreightQueryDto } from '../../usecases/find-all-freight/dtos/find-all-freight.dto';

export interface IFreightDao {
  findAll(queries: FindAllFreightQueryDto): Promise<[FreightDto[], number]>;
  findById(id: number): Promise<FreightDto | null>;
  findByName(name: string): Promise<FreightDto | null>;
  save(data: CreateFreightInputDto): Promise<number>;
  edit(id: number, data: EditFreightInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByFreightId(freightId: number): Promise<number>;
}
