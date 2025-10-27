import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { CreateAddress } from 'src/app/address/application/usecases/create-address/create-address.service';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { DeleteAddress } from 'src/app/address/application/usecases/delete-address/delete-address.service';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { EditAddress } from 'src/app/address/application/usecases/edit-address/edit-address.service';
import { FindAddressById } from 'src/app/address/application/usecases/find-address-by-id/find-address-by-id.service';
import { FindAllAddressQueryDto } from 'src/app/address/application/usecases/find-all-address/dtos/find-all-address.dto';
import { FindAllAddress } from 'src/app/address/application/usecases/find-all-address/find-all-address.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
export declare class AddressSecondaryController {
    private readonly createAddressService;
    private readonly findAllAddressService;
    private readonly findAddressByIdService;
    private readonly editAddressService;
    private readonly deleteAddressService;
    private readonly IS_MAIN;
    constructor(createAddressService: CreateAddress, findAllAddressService: FindAllAddress, findAddressByIdService: FindAddressById, editAddressService: EditAddress, deleteAddressService: DeleteAddress);
    create(body: CreateAddressInputDto): Promise<CreateAddressOutputDto>;
    findAll(queries: FindAllAddressQueryDto): Promise<IPagination<AddressDto>>;
    findOne(params: Params): Promise<AddressDto>;
    update(params: Params, body: EditAddressInputDto): Promise<SuccessMessage>;
    remove(params: Params): Promise<SuccessMessage>;
}
