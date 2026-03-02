import { ClientAddressType } from 'src/app/client-address/domain/enums/client-address-type.enum';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import { FindAllClientAddressQueryDto } from '../../usecases/find-all-client-address/dtos/find-all-client-address.dto';

export interface IClientAddressDao {
  findAll(queries: FindAllClientAddressQueryDto): Promise<[ClientAddressDto[], number]>;
  findById(id: number): Promise<ClientAddressDto | null>;
  findByClientIdAndType(clientId: number, type: ClientAddressType): Promise<ClientAddressDto | null>;
}
