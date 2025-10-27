"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../address.module");
const address_not_found_error_1 = require("../../../domain/errors/address-not-found.error");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_address_service_1 = require("../create-address/create-address.service");
const find_address_by_id_service_1 = require("../find-address-by-id/find-address-by-id.service");
const edit_address_service_1 = require("./edit-address.service");
describe('EditAddress', () => {
    let sut;
    let prisma;
    let createAddress;
    let findAddressById;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                address_module_1.AddressModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(edit_address_service_1.EditAddress);
        prisma = module.get(prisma_service_1.PrismaService);
        createAddress = module.get(create_address_service_1.CreateAddress);
        findAddressById = module.get(find_address_by_id_service_1.FindAddressById);
        await prisma.address.deleteMany();
    });
    afterAll(async () => {
        await prisma.address.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should throw an error if address not found', async () => {
        const data = (0, ts_jest_1.createMock)();
        expect.assertions(1);
        return sut.execute('non-existing-id', true, data).catch((error) => {
            expect(error).toBeInstanceOf(address_not_found_error_1.AddressNotFoundError);
        });
    });
    it('should throw an error if main address not found', async () => {
        const secondaryAddress = await createAddress.execute({
            zipCode: '12345678',
            street: 'Rua Secundária',
            number: '456',
            neighborhood: 'Bairro Secundário',
            city: 'Cidade Secundária',
            state: 'Estado Secundário',
            ownerId: 'owner-123',
        }, false);
        const data = (0, ts_jest_1.createMock)();
        expect.assertions(1);
        return sut.execute(secondaryAddress.id, true, data).catch((error) => {
            expect(error).toBeInstanceOf(address_not_found_error_1.AddressNotFoundError);
        });
    });
    it('should throw an error if secondary address not found', async () => {
        const mainAddress = await createAddress.execute({
            zipCode: '12345678',
            street: 'Rua Principal',
            number: '123',
            neighborhood: 'Bairro Principal',
            city: 'Cidade Principal',
            state: 'Estado Principal',
            ownerId: 'owner-123',
        }, true);
        const data = (0, ts_jest_1.createMock)();
        expect.assertions(1);
        return sut.execute(mainAddress.id, false, data).catch((error) => {
            expect(error).toBeInstanceOf(address_not_found_error_1.AddressNotFoundError);
        });
    });
    it.each([
        true,
        false,
    ])('should edit address successfully (isMain=%s)', async (isMain) => {
        const data = {
            zipCode: '12345678',
            street: 'Rua Principal',
            number: '123',
            neighborhood: 'Bairro Principal',
            city: 'Cidade Principal',
            state: 'Estado Principal',
            ownerId: 'owner-123',
        };
        const mainAddress = await createAddress.execute(data, isMain);
        const dataEdited = {
            zipCode: '87654321',
            street: 'Rua Editada',
            number: '321',
            neighborhood: 'Bairro Editado',
        };
        const result = await sut.execute(mainAddress.id, isMain, dataEdited);
        expect(result).toEqual({ message: 'Endereço atualizado com sucesso!' });
        const updatedAddress = await findAddressById.execute(mainAddress.id, isMain);
        expect(updatedAddress).toMatchObject({
            id: mainAddress.id,
            zipCode: dataEdited.zipCode,
            street: dataEdited.street,
            number: dataEdited.number,
            neighborhood: dataEdited.neighborhood,
            city: data.city,
            state: data.state,
            ownerId: data.ownerId,
            isMain,
        });
    });
});
//# sourceMappingURL=edit-address.service.spec.js.map