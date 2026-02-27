import { ClientDto } from '../../dtos/client.dto';
import { FindAllClientQueryDto } from '../../usecases/find-all-client/dtos/find-all-client.dto';

export interface IClientDao {
  findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]>;
  findById(id: number): Promise<ClientDto | null>;
  findByDocument(document: string): Promise<ClientDto | null>;
}
