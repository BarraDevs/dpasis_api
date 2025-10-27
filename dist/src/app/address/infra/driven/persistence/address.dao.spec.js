"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const address_persistence_module_1 = require("../../../application/persistence/address-persistence.module");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const address_dao_1 = require("./address.dao");
describe('AddressDaoAdapterPrisma', () => {
    let sut;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                address_persistence_module_1.AddressPersistenceModule,
                config_module_1.ConfigModule,
            ],
            providers: [
                address_dao_1.AddressDaoAdapterPrisma,
            ],
        }).compile();
        sut = module.get(address_dao_1.AddressDaoAdapterPrisma);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.address.deleteMany();
    });
    afterAll(async () => {
        await prisma.address.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('save', () => {
        it('should save an address', async () => {
            const data = {
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            };
            const id = await sut.save(data, true);
            expect(id).toBeDefined();
            const address = await prisma.address.findUnique({ where: { id } });
            expect(address).toMatchObject({ ...data, isMain: true });
        });
        it('should call prisma.address.create with correct values', async () => {
            const data = {
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            };
            const createSpy = jest.spyOn(prisma.address, 'create').mockResolvedValue({ id: 'address-123' });
            await sut.save(data, false);
            expect(createSpy).toHaveBeenCalledWith({
                data: { ...data, isMain: false },
            });
        });
    });
    describe('findAll', () => {
        it.each([
            true,
            false,
        ])('should return empty array and zero count when no addresses exist', async (isMain) => {
            const [addresses, count] = await sut.findAll({ isMain, ownerId: 'non-existent-owner' });
            expect(addresses).toEqual([]);
            expect(count).toBe(0);
        });
        it('should filter addresses by isMain=true', async () => {
            const ownerId = 'owner-123';
            await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId,
            }, true);
            await sut.save({
                zipCode: '67890',
                street: '456 Side St',
                number: 'B2',
                complement: 'Suite 5C',
                neighborhood: 'Uptown',
                city: 'Othertown',
                state: 'NY',
                ownerId,
            }, false);
            const [mainAddresses, mainCount] = await sut.findAll({ isMain: true, ownerId });
            expect(mainAddresses.length).toBe(1);
            expect(mainAddresses[0].isMain).toBe(true);
            expect(mainAddresses[0].zipCode).toBe('12345');
            expect(mainCount).toBe(1);
        });
        it('should filter addresses by isMain=false', async () => {
            const ownerId = 'owner-123';
            await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId,
            }, true);
            await sut.save({
                zipCode: '67890',
                street: '456 Side St',
                number: 'B2',
                complement: 'Suite 5C',
                neighborhood: 'Uptown',
                city: 'Othertown',
                state: 'NY',
                ownerId,
            }, false);
            const [nonMainAddresses, nonMainCount] = await sut.findAll({ isMain: false, ownerId });
            expect(nonMainAddresses.length).toBe(1);
            expect(nonMainAddresses[0].isMain).toBe(false);
            expect(nonMainAddresses[0].zipCode).toBe('67890');
            expect(nonMainCount).toBe(1);
        });
        it('should filter addresses by ownerId', async () => {
            const data = {
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: '',
            };
            await sut.save({ ...data, ownerId: 'owner-1' }, true);
            await sut.save({ ...data, ownerId: 'owner-2' }, true);
            await sut.save({ ...data, ownerId: 'owner-1' }, false);
            const [owner1Addresses, owner1Count] = await sut.findAll({ isMain: true, ownerId: 'owner-1' });
            expect(owner1Addresses.length).toBe(1);
            expect(owner1Addresses[0].ownerId).toBe('owner-1');
            expect(owner1Count).toBe(1);
        });
        it('should paginate results', async () => {
            const ownerId = 'owner-123';
            for (let i = 0; i < 15; i++) {
                await sut.save({
                    zipCode: `0000${i}`,
                    street: `Street ${i}`,
                    number: `${i}`,
                    complement: `Complement ${i}`,
                    neighborhood: `Neighborhood ${i}`,
                    city: `City ${i}`,
                    state: `State ${i}`,
                    ownerId,
                }, true);
            }
            const [addressesPage1, count1] = await sut.findAll({ isMain: true, page: 1, size: 5, ownerId });
            expect(addressesPage1.length).toBe(5);
            expect(count1).toBe(15);
            expect(addressesPage1[0].zipCode).toBe('000014');
            const [addressesPage2, count2] = await sut.findAll({ isMain: true, page: 2, size: 5, ownerId });
            expect(addressesPage2.length).toBe(5);
            expect(count2).toBe(15);
            expect(addressesPage2[0].zipCode).toBe('00009');
        });
        it('should list addresses in descending order by creation date', async () => {
            const ownerId = 'owner-123';
            const ids = [];
            for (let i = 0; i < 3; i++) {
                const id = await sut.save({
                    zipCode: `0000${i}`,
                    street: `Street ${i}`,
                    number: `${i}`,
                    complement: `Complement ${i}`,
                    neighborhood: `Neighborhood ${i}`,
                    city: `City ${i}`,
                    state: `State ${i}`,
                    ownerId,
                }, true);
                ids.push(id);
            }
            const [addresses] = await sut.findAll({ isMain: true, ownerId });
            expect(addresses.length).toBe(3);
            expect(addresses[0].id).toBe(ids[2]);
            expect(addresses[1].id).toBe(ids[1]);
            expect(addresses[2].id).toBe(ids[0]);
        });
    });
    describe('findById', () => {
        it('should return null if address not found', async () => {
            const mainAddress = await sut.findById('non-existent-id', true);
            expect(mainAddress).toBeNull();
            const nonMainAddress = await sut.findById('non-existent-id', false);
            expect(nonMainAddress).toBeNull();
        });
        it('should return null if address is not main when isMain is true', async () => {
            const addressId = await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, false);
            const address = await sut.findById(addressId, true);
            expect(address).toBeNull();
        });
        it('should return null if address is main when isMain is false', async () => {
            const addressId = await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, true);
            const address = await sut.findById(addressId, false);
            expect(address).toBeNull();
        });
        it('should return the address if found with isMain true', async () => {
            const addressId = await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, true);
            const address = await sut.findById(addressId, true);
            expect(address).toBeDefined();
            expect(address).toEqual({
                id: addressId,
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
                isMain: true,
                nickname: null,
                reference: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
        });
        it('should return the address if found with isMain false', async () => {
            const addressId = await sut.save({
                nickname: 'Work',
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                reference: 'Near the big park',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, false);
            const address = await sut.findById(addressId, false);
            expect(address).toBeDefined();
            expect(address).toEqual({
                id: addressId,
                nickname: 'Work',
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                reference: 'Near the big park',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
                isMain: false,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
        });
    });
    describe('findMainAddress', () => {
        it('should return null if no main address exists for the owner', async () => {
            const mainAddress = await sut.findMainAddress('non-existent-owner');
            expect(mainAddress).toBeNull();
        });
        it('should return the main address for the owner if it exists', async () => {
            const addressId = await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, true);
            const mainAddress = await sut.findMainAddress('owner-123');
            expect(mainAddress).toBeDefined();
            expect(mainAddress?.id).toBe(addressId);
        });
        it('should not return a non-main address for the owner', async () => {
            await sut.save({
                zipCode: '67890',
                street: '456 Side St',
                number: 'B2',
                complement: 'Suite 5C',
                neighborhood: 'Uptown',
                city: 'Othertown',
                state: 'NY',
                ownerId: 'owner-456',
            }, false);
            const mainAddress = await sut.findMainAddress('owner-456');
            expect(mainAddress).toBeNull();
        });
        it('should return the correct main address when multiple addresses exist for the owner', async () => {
            const ownerId = 'owner-789';
            const mainAddressId = await sut.save({
                zipCode: '11111',
                street: '111 Main St',
                number: '1A',
                complement: 'Apt 1',
                neighborhood: 'Central',
                city: 'Metropolis',
                state: 'IL',
                ownerId,
            }, true);
            await sut.save({
                zipCode: '22222',
                street: '222 Side St',
                number: '2B',
                complement: 'Suite 2',
                neighborhood: 'Westside',
                city: 'Metropolis',
                state: 'IL',
                ownerId,
            }, false);
            const mainAddress = await sut.findMainAddress('owner-789');
            expect(mainAddress).toBeDefined();
            expect(mainAddress?.id).toBe(mainAddressId);
        });
        it('should call prisma.address.findFirst with correct values', async () => {
            const findFirstSpy = jest.spyOn(prisma.address, 'findFirst').mockResolvedValue(null);
            await sut.findMainAddress('owner-123');
            expect(findFirstSpy).toHaveBeenCalledWith({
                where: { ownerId: 'owner-123', isMain: true },
            });
        });
    });
    describe('edit', () => {
        it('should edit an existing address', async () => {
            const addressId = await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, true);
            await sut.edit(addressId, {
                street: '456 Updated St',
                city: 'New City',
            });
            const updatedAddress = await prisma.address.findUnique({ where: { id: addressId } });
            expect(updatedAddress).toMatchObject({
                zipCode: '12345',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                state: 'CA',
                ownerId: 'owner-123',
                street: '456 Updated St',
                city: 'New City',
            });
        });
        it('should call prisma.address.update with correct values', async () => {
            const addressId = 'address-to-edit';
            const updateSpy = jest.spyOn(prisma.address, 'update').mockResolvedValue({});
            const editData = {
                street: '789 New St',
                city: 'Changed City',
            };
            await sut.edit(addressId, editData);
            expect(updateSpy).toHaveBeenCalledWith({
                where: { id: addressId },
                data: editData,
            });
        });
    });
    describe('delete', () => {
        it('should delete an existing address', async () => {
            const addressId = await sut.save({
                zipCode: '12345',
                street: '123 Main St',
                number: 'A1',
                complement: 'Apt 4B',
                neighborhood: 'Downtown',
                city: 'Anytown',
                state: 'CA',
                ownerId: 'owner-123',
            }, true);
            await sut.delete(addressId);
            const deletedAddress = await prisma.address.findUnique({ where: { id: addressId } });
            expect(deletedAddress).toBeNull();
        });
        it('should call prisma.address.delete with correct values', async () => {
            const addressId = 'address-to-delete';
            const deleteSpy = jest.spyOn(prisma.address, 'delete').mockResolvedValue({});
            await sut.delete(addressId);
            expect(deleteSpy).toHaveBeenCalledWith({
                where: { id: addressId },
            });
        });
    });
});
//# sourceMappingURL=address.dao.spec.js.map