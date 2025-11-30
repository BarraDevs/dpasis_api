import { ClientDto } from '../../dtos/client.dto';
import { FindAllClientQueryDto } from '../../usecases/find-all-client/dtos/find-all-client.dto';

export interface IClientDao {
  findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]>;
  findById(id: string): Promise<ClientDto | null>;
  findByCnpj(cnpj: string): Promise<ClientDto | null>;
}
