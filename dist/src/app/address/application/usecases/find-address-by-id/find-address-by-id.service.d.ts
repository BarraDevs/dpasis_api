import { AddressDto } from '../../dtos/address.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
export declare class FindAddressById {
    private readonly addressDao;
    constructor(addressDao: IAddressDao);
    execute(id: string, isMain: boolean): Promise<AddressDto>;
}
