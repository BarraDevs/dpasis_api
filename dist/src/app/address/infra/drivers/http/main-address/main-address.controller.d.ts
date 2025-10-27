import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { CreateAddress } from 'src/app/address/application/usecases/create-address/create-address.service';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { EditAddress } from 'src/app/address/application/usecases/edit-address/edit-address.service';
import { FindMainAddress } from 'src/app/address/application/usecases/find-main-address/find-main-address.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
export declare class AddressMainController {
    private readonly createAddressService;
    private readonly findMainAddressService;
    private readonly editAddressService;
    private readonly IS_MAIN;
    constructor(createAddressService: CreateAddress, findMainAddressService: FindMainAddress, editAddressService: EditAddress);
    create(body: CreateAddressInputDto): Promise<CreateAddressOutputDto>;
    findOne(params: Params): Promise<AddressDto | null>;
    update(params: Params, body: EditAddressInputDto): Promise<SuccessMessage>;
}
