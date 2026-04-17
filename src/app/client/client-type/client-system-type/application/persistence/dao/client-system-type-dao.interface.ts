import { ClientSystemTypeDto } from '../../dtos/client-system-type.dto';
import { FindAllClientSystemTypeQueryDto } from '../../usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';

export type ClientSystemTypeSaveInput = {
  name: string;
  imageUrl: string | null;
};

export type ClientSystemTypeEditInput = {
  name: string;
  imageUrl?: string | null;
};

export interface IClientSystemTypeDao {
  findAll(queries: FindAllClientSystemTypeQueryDto): Promise<[ClientSystemTypeDto[], number]>;
  findById(id: number): Promise<ClientSystemTypeDto | null>;
  findByName(name: string): Promise<ClientSystemTypeDto | null>;
  findByImageUrlExcludingId(imageUrl: string, excludeId: number): Promise<number>;
  save(data: ClientSystemTypeSaveInput): Promise<number>;
  edit(id: number, data: ClientSystemTypeEditInput): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countClientTypesBySystemTypeId(systemTypeId: number): Promise<number>;
}
