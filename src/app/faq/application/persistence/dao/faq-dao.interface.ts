import { FaqDto } from '../../dtos/faq.dto';
import { CreateFaqInputDto } from '../../usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from '../../usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqQueryDto } from '../../usecases/find-all-faq/dtos/find-all-faq.dto';

export interface IFaqDao {
  findAll(queries: FindAllFaqQueryDto): Promise<[FaqDto[], number]>;
  findById(id: number): Promise<FaqDto | null>;
  save(data: CreateFaqInputDto): Promise<number>;
  edit(id: number, data: EditFaqInputDto): Promise<void>;
  delete(id: number): Promise<void>;
}
