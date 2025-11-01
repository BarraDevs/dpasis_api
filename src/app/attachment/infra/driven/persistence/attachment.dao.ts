import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AttachmentDto } from 'src/app/attachment/application/dtos/attachment.dto';
import { IAttachmentDao } from 'src/app/attachment/application/persistence/dao/attachment-dao.interface';
import { CreateAttachmentInputDto } from 'src/app/attachment/application/usecases/create-attachment/dtos/create-attachment.dto';
import { EditAttachmentInputDto } from 'src/app/attachment/application/usecases/edit-attachment/dtos/edit-attachment.dto';
import { FindAllAttachmentQueryDto } from 'src/app/attachment/application/usecases/find-all-attachment/dtos/find-all-attachment.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class AttachmentDaoAdapterPrisma implements IAttachmentDao {
  constructor(private prisma: PrismaService) {}

  public async save({ ownerId, ...rest }: CreateAttachmentInputDto): Promise<string> {
    const result = await this.prisma.attachment.create({
      data: {
        ...rest,
        owner: {
          connect: {
            id: ownerId,
          },
        },
      },
    });
    return result.id;
  }

  public async findAll(queries: FindAllAttachmentQueryDto): Promise<[AttachmentDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.AttachmentWhereInput = {
      AND: [
        {
          ownerId: queries.ownerId,
          OR: [
            { link: { contains: queries.search, mode: 'insensitive' } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.attachment.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attachment.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<AttachmentDto | null> {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  public async edit(id: string, data: EditAttachmentInputDto): Promise<void> {
    await this.prisma.attachment.update({
      where: { id },
      data, // ownerId não está incluído aqui devido ao OmitType no DTO
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.attachment.delete({
      where: { id },
    });
  }
}
