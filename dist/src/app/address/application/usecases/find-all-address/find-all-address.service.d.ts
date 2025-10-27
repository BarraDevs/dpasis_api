import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AddressDto } from '../../dtos/address.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { FindAllAddressQueryDto } from './dtos/find-all-address.dto';
export declare class FindAllAddress {
    private readonly addressDao;
    constructor(addressDao: IAddressDao);
    execute(queries: FindAllAddressQueryDto): Promise<IPagination<AddressDto>>;
}
