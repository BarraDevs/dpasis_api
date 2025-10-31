import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { IAddressDao } from 'src/app/address/application/persistence/dao/address-dao.interface';
import { CreateAddressInputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { FindAllAddressQueryDto } from 'src/app/address/application/usecases/find-all-address/dtos/find-all-address.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class AddressDaoAdapterPrisma implements IAddressDao {
  constructor(private prisma: PrismaService) {}

  public async save({ ownerId, ...rest }: CreateAddressInputDto, isMain: boolean): Promise<string> {
    const address = await this.prisma.address.create({
      data: {
        ...rest,
        isMain,
        owner: {
          connect: {
            id: ownerId,
          },
        },
      },
    });

    return address.id;
  }

  public async findAll(queries: FindAllAddressQueryDto): Promise<[AddressDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.AddressWhereInput = {
      isMain: queries.isMain,
      ownerId: queries.ownerId,
    };

    return this.prisma.$transaction([
      this.prisma.address.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.address.count({ where }),
    ]);
  }

  public async findById(id: string, isMain: boolean): Promise<AddressDto | null> {
    return this.prisma.address.findUnique({
      where: { id, isMain },
    });
  }

  public async findMainAddress(ownerId: string): Promise<AddressDto | null> {
    return this.prisma.address.findFirst({
      where: { ownerId, isMain: true },
    });
  }

  public async edit(id: string, data: EditAddressInputDto): Promise<void> {
    await this.prisma.address.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }
}
