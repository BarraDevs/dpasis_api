import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ShipperDto } from 'src/app/shipper/application/dtos/shipper.dto';
import { IShipperDao } from 'src/app/shipper/application/persistence/dao/shipper-dao.interface';
import { CreateShipperInputDto } from 'src/app/shipper/application/usecases/create-shipper/dtos/create-shipper.dto';
import { EditShipperInputDto } from 'src/app/shipper/application/usecases/edit-shipper/dtos/edit-shipper.dto';
import { FindAllShipperQueryDto } from 'src/app/shipper/application/usecases/find-all-shipper/dtos/find-all-shipper.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ShipperDaoAdapterPrisma implements IShipperDao {
  constructor(private prisma: PrismaService) {}

  public async save(data: CreateShipperInputDto): Promise<string> {
    const result = await this.prisma.shipper.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllShipperQueryDto): Promise<[ShipperDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ShipperWhereInput = {
      AND: [
        { companyName: queries.companyName ? { contains: queries.companyName, mode: 'insensitive' } : undefined },
        { fantasyName: queries.fantasyName ? { contains: queries.fantasyName, mode: 'insensitive' } : undefined },
        { cnpj: queries.cnpj ? { contains: queries.cnpj } : undefined },
        { contact: queries.contact ? { contains: queries.contact, mode: 'insensitive' } : undefined },
        { representative: queries.representative ? { contains: queries.representative, mode: 'insensitive' } : undefined },
        {
          OR: [
            { zipCode: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { street: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { number: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { neighborhood: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { city: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { state: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.shipper.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipper.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ShipperDto | null> {
    return this.prisma.shipper.findUnique({
      where: { id },
    });
  }

  public async findByCnpj(cnpj: string): Promise<ShipperDto | null> {
    return this.prisma.shipper.findUnique({
      where: { cnpj },
    });
  }

  public async edit(id: string, data: EditShipperInputDto): Promise<void> {
    await this.prisma.shipper.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.shipper.delete({
      where: { id },
    });
  }
}
