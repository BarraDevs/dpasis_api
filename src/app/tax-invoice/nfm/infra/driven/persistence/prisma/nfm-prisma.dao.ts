import { Injectable } from '@nestjs/common';
import { INfmDao } from 'src/app/tax-invoice/nfm/application/persistence/dao/nfm-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class NfmDaoAdapterPrisma implements INfmDao {
  constructor(private readonly prisma: PrismaService) {}

  // public async save(data: CreateNfmInputDto): Promise<number> {
  //   const result = await this.prisma.nfm.create({
  //     data,
  //   });

  //   return result.id;
  // }

  // public async findAll(queries: FindAllNfmQueryDto): Promise<[NfmDto[], number]> {
  //   const pagination = this.prisma.paginationFactory(queries.page, queries.size);

  //   const where: Prisma.NfmWhereInput = {
  //     AND: [
  //       {
  //         OR: [
  //           { field: { contains: queries.search, mode: 'insensitive' } },
  //         ],
  //       },
  //     ],
  //   };

  //   return this.prisma.$transaction([
  //     this.prisma.nfm.findMany({
  //       where,
  //       take: pagination.take,
  //       skip: pagination.skip,
  //       orderBy: { id: 'asc' },
  //     }),
  //     this.prisma.nfm.count({ where }),
  //   ]);
  // }

  // public async findById(id: number): Promise<NfmDto | null> {
  //   return this.prisma.nfm.findUnique({
  //     where: { id },
  //   });
  // }

  // public async edit(id: number, data: EditNfmInputDto): Promise<void> {
  //   await this.prisma.nfm.update({
  //     where: { id },
  //     data,
  //   });
  // }

  // public async delete(id: number): Promise<void> {
  //   await this.prisma.nfm.delete({
  //     where: { id },
  //   });
  // }
}
