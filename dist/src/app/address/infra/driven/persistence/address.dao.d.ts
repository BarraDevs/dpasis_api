import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { IAddressDao } from 'src/app/address/application/persistence/dao/address-dao.interface';
import { CreateAddressInputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { FindAllAddressQueryDto } from 'src/app/address/application/usecases/find-all-address/dtos/find-all-address.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
export declare class AddressDaoAdapterPrisma implements IAddressDao {
    private prisma;
    constructor(prisma: PrismaService);
    save(data: CreateAddressInputDto, isMain: boolean): Promise<string>;
    findAll(queries: FindAllAddressQueryDto): Promise<[AddressDto[], number]>;
    findById(id: string, isMain: boolean): Promise<AddressDto | null>;
    findMainAddress(id: string): Promise<AddressDto | null>;
    edit(id: string, data: EditAddressInputDto): Promise<void>;
    delete(id: string): Promise<void>;
}
