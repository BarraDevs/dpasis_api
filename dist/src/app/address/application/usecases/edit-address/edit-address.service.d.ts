import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { EditAddressInputDto } from './dtos/edit-address.dto';
export declare class EditAddress {
    private readonly addressDao;
    constructor(addressDao: IAddressDao);
    execute(id: string, isMain: boolean, data: EditAddressInputDto): Promise<SuccessMessage>;
}
