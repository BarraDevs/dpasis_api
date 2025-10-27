import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { CreateAddressInputDto, CreateAddressOutputDto } from './dtos/create-address.dto';
export declare class CreateAddress {
    private readonly addressDao;
    constructor(addressDao: IAddressDao);
    execute(data: CreateAddressInputDto, isMain: boolean): Promise<CreateAddressOutputDto>;
}
