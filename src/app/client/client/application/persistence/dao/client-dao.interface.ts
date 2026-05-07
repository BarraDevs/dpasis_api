import { ClientDto } from '../../dtos/client.dto';
import { FindAllClientQueryDto } from '../../usecases/find-all-client/dtos/find-all-client.dto';
import { FindSubClientsQueryDto } from '../../usecases/find-sub-clients/dtos/find-sub-clients.dto';
import { SearchClientInputDto } from '../../usecases/search-client/dtos/search-client.dto';

export interface IClientDao {
  findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]>;
  search(input: SearchClientInputDto): Promise<[ClientDto[], number]>;
  findById(id: number): Promise<ClientDto | null>;
  findByDocument(document: string): Promise<ClientDto | null>;
  findMaxId(): Promise<number>;
  countSubClients(clientId: number): Promise<number>;
  findSubClients(clientId: number, queries: FindSubClientsQueryDto): Promise<[ClientDto[], number]>;
}
