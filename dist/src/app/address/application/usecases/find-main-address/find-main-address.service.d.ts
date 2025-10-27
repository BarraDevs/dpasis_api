import { AddressDto } from '../../dtos/address.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
export declare class FindMainAddress {
    private readonly addressDao;
    constructor(addressDao: IAddressDao);
    execute(id: string): Promise<AddressDto | null>;
}
