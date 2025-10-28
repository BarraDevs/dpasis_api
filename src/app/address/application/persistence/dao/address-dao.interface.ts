import { AddressDto } from '../../dtos/address.dto';
import { CreateAddressInputDto } from '../../usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from '../../usecases/edit-address/dtos/edit-address.dto';
import { FindAllAddressQueryDto } from '../../usecases/find-all-address/dtos/find-all-address.dto';

export interface IAddressDao {
  findAll(queries: FindAllAddressQueryDto): Promise<[AddressDto[], number]>;
  findById(id: string, isMain: boolean): Promise<AddressDto | null>;
  findMainAddress(ownerId: string): Promise<AddressDto | null>;
  save(data: CreateAddressInputDto, isMain: boolean): Promise<string>;
  edit(id: string, data: EditAddressInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
