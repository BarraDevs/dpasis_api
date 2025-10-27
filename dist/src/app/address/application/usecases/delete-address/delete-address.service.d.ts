import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
export declare class DeleteAddress {
    private addressDao;
    constructor(addressDao: IAddressDao);
    execute(id: string): Promise<SuccessMessage>;
}
